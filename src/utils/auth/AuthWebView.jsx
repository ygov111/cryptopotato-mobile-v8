import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useAuthStore } from "./store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const callbackUrl = "/api/auth/token";
const callbackQueryString = `callbackUrl=${callbackUrl}`;

/**
 * This renders a WebView for authentication and handles both web and native platforms.
 */
export const AuthWebView = ({ mode, proxyURL, baseURL }) => {
  const [currentURI, setURI] = useState(
    `${baseURL}/account/${mode}?${callbackQueryString}`,
  );
  const { auth, setAuth, isReady } = useAuthStore();
  const isAuthenticated = isReady ? !!auth : null;
  const iframeRef = useRef(null);

  const migrateLocalDataToServer = async () => {
    try {
      console.log("🔄 Starting data migration...");
      const [pointsStr, portfolioStr] = await Promise.all([
        AsyncStorage.getItem("points"),
        AsyncStorage.getItem("portfolio"),
      ]);

      const points = pointsStr ? JSON.parse(pointsStr).points : 0;
      const portfolio = portfolioStr ? JSON.parse(portfolioStr) : [];

      console.log("📦 Local data found:", {
        points,
        portfolioCount: portfolio.length,
      });

      if (points > 0 || portfolio.length > 0) {
        // CRITICAL: Use baseURL for API calls, not proxyURL
        // proxyURL is for WebView navigation, baseURL is for fetch requests
        const apiUrl = `${baseURL}/api/auth/migrate-local-data`;

        console.log("📡 Migration starting...");
        console.log("📡 Platform:", Platform.OS);
        console.log("📡 API URL:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ points, portfolio, alerts: [] }),
        });

        console.log("📡 Migration response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Migration failed:", response.status, errorText);
          throw new Error(
            `Migration failed: ${response.status} - ${errorText}`,
          );
        }

        const result = await response.json();
        console.log("✅ Data migrated successfully:", result);

        // Clear local storage after successful migration
        await Promise.all([
          AsyncStorage.removeItem("points"),
          AsyncStorage.removeItem("portfolio"),
        ]);
        console.log("🗑️ Local data cleared after migration");
      } else {
        console.log("ℹ️ No local data to migrate");
      }
    } catch (error) {
      console.error("❌ Migration error:", error.message);
      console.error("❌ Stack:", error.stack);
      // Don't throw - we don't want to block login if migration fails
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    if (isAuthenticated) {
      // Migrate data before navigating back - wait for migration to complete
      (async () => {
        await migrateLocalDataToServer();
        router.back();
      })();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setURI(`${baseURL}/account/${mode}?${callbackQueryString}`);
  }, [mode, baseURL, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) {
      return;
    }
    const handleMessage = async (event) => {
      // Verify the origin for security
      if (event.origin !== process.env.EXPO_PUBLIC_PROXY_BASE_URL) {
        return;
      }
      if (event.data.type === "AUTH_SUCCESS") {
        setAuth({
          jwt: event.data.jwt,
          user: event.data.user,
        });

        // For web platform, migration needs to happen on the server
        // The iframe can't make cross-origin fetch requests
        // So we'll clear local storage here (migration happens server-side)
        try {
          await Promise.all([
            AsyncStorage.removeItem("points"),
            AsyncStorage.removeItem("portfolio"),
          ]);
          console.log("🗑️ Local data cleared (web platform)");
        } catch (err) {
          console.error("Failed to clear local storage:", err);
        }
      } else if (event.data.type === "AUTH_ERROR") {
        console.error("Auth error:", event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setAuth]);

  if (Platform.OS === "web") {
    const handleIframeError = () => {
      console.error("Failed to load auth iframe");
    };

    return (
      <iframe
        ref={iframeRef}
        title="Authentication"
        src={`${proxyURL}/account/${mode}?callbackUrl=/api/auth/expo-web-success`}
        style={{ width: "100%", height: "100%", border: "none" }}
        onError={handleIframeError}
      />
    );
  }
  return (
    <WebView
      sharedCookiesEnabled
      source={{
        uri: currentURI,
      }}
      headers={{
        "x-createxyz-project-group-id":
          process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
        host: process.env.EXPO_PUBLIC_HOST,
        "x-forwarded-host": process.env.EXPO_PUBLIC_HOST,
        "x-createxyz-host": process.env.EXPO_PUBLIC_HOST,
      }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === `${baseURL}${callbackUrl}`) {
          fetch(request.url).then(async (response) => {
            response.json().then((data) => {
              setAuth({ jwt: data.jwt, user: data.user });
            });
          });
          return false;
        }
        if (request.url === currentURI) return true;

        // Add query string properly by checking if URL already has parameters
        const hasParams = request.url.includes("?");
        const separator = hasParams ? "&" : "?";
        const newURL = request.url.replaceAll(proxyURL, baseURL);
        if (newURL.endsWith(callbackUrl)) {
          setURI(newURL);
          return false;
        }
        setURI(`${newURL}${separator}${callbackQueryString}`);
        return false;
      }}
      style={{ flex: 1 }}
    />
  );
};
