import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { Modal, View } from "react-native";
import { useAuthModal, useAuthStore, authKey } from "./store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * This hook provides authentication functionality.
 * It may be easier to use the `useAuthModal` or `useRequireAuth` hooks
 * instead as those will also handle showing authentication to the user
 * directly.
 */
export const useAuth = () => {
  const { isReady, auth, setAuth } = useAuthStore();
  const { isOpen, close, open } = useAuthModal();

  const initiate = useCallback(() => {
    SecureStore.getItemAsync(authKey).then((auth) => {
      useAuthStore.setState({
        auth: auth ? JSON.parse(auth) : null,
        isReady: true,
      });
    });
  }, []);

  const migrateLocalData = useCallback(async () => {
    try {
      // Get local data
      const [pointsStr, portfolioStr, alertsStr] = await Promise.all([
        AsyncStorage.getItem("points"),
        AsyncStorage.getItem("portfolio"),
        AsyncStorage.getItem("priceAlerts"),
      ]);

      const points = pointsStr ? JSON.parse(pointsStr).points : 0;
      const portfolio = portfolioStr ? JSON.parse(portfolioStr) : [];
      const alerts = alertsStr ? JSON.parse(alertsStr) : [];

      // Only migrate if there's data
      if (points > 0 || portfolio.length > 0) {
        const response = await fetch("/api/auth/migrate-local-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points, portfolio, alerts }),
        });

        if (response.ok) {
          console.log("✅ Local data migrated to server");
        }
      }
    } catch (error) {
      console.error("Failed to migrate local data:", error);
    }
  }, []);

  useEffect(() => {}, []);

  const signIn = useCallback(() => {
    open({ mode: "signin" });
  }, [open]);
  const signUp = useCallback(() => {
    open({ mode: "signup" });
  }, [open]);

  const signOut = useCallback(() => {
    setAuth(null);
    close();
  }, [close]);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    signIn,
    signOut,
    signUp,
    auth,
    setAuth,
    initiate,
    migrateLocalData,
  };
};

/**
 * This hook will automatically open the authentication modal if the user is not authenticated.
 */
export const useRequireAuth = (options) => {
  const { isAuthenticated, isReady } = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      open({ mode: options?.mode });
    }
  }, [isAuthenticated, open, options?.mode, isReady]);
};

export default useAuth;
