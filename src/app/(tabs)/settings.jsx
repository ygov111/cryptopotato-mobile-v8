import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Globe,
  User,
  ChevronRight,
  Check,
  Bell,
  Copy,
  ExternalLink,
  Database,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import useUser from "@/utils/auth/useUser";
import { useAuth } from "@/utils/auth/useAuth";
import { LANGUAGES, getUIText, DEFAULT_LANGUAGE, setRTL } from "@/utils/i18n";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const { signIn, signOut, signUp } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const appUrl = process.env.EXPO_PUBLIC_BASE_URL || "Unknown";
  const adminUrl = `${appUrl}/admin`;

  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${label} copied to clipboard`);
  };

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem("userLanguage");
      if (saved) setLanguage(saved);
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  };

  const t = (key) => getUIText(key, language);

  // Fetch user points
  const { data: userPoints } = useQuery({
    queryKey: ["userPoints", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await fetch("/api/rewards/get");
        if (!response.ok) throw new Error("Failed to fetch points");
        const data = await response.json();
        return data.points || 0;
      }
      const stored = await AsyncStorage.getItem("points");
      const parsed = stored
        ? JSON.parse(stored)
        : { points: 0, lastClaimAt: null };
      return parsed.points || 0;
    },
    refetchInterval: 2000,
    staleTime: 0,
  });

  // Load price alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts", user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const changeLanguage = async (langCode) => {
    try {
      const lang = LANGUAGES.find((l) => l.code === langCode);
      if (!lang) return;

      const previousLang = language;
      await AsyncStorage.setItem("userLanguage", langCode);
      setLanguage(langCode);
      setShowLanguageModal(false);

      // Update RTL if needed (requires app restart)
      setRTL(lang.rtl);

      // Save to backend if user is signed in
      if (user?.id) {
        await fetch("/api/user/language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: langCode }),
        });
      }

      // Show restart message if language actually changed
      if (previousLang !== langCode) {
        Alert.alert(
          "Language Changed",
          "Please close and reopen the app for the language change to take full effect.",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const currentLang =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderColor: "#222222",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >
              {t("settingsTitle")}
            </Text>
            <Text style={{ color: "#999999", fontSize: 14 }}>
              {t("settingsSubtitle")}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Pressable
              onPress={() => router.push("/(tabs)/rewards")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#fed319",
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>🥔</Text>
              <Text
                style={{ color: "#fed319", fontSize: 16, fontWeight: "bold" }}
              >
                {userPoints || 0}
              </Text>
            </Pressable>

            {alerts.length > 0 && (
              <Pressable
                onPress={() => router.push("/(tabs)/alerts")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#1a1a1a",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#fed319",
                }}
              >
                <Bell size={20} color="#fed319" />
                <Text
                  style={{
                    color: "#fed319",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginLeft: 6,
                  }}
                >
                  {alerts.length}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Section */}
        <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "#666666",
              fontSize: 12,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {t("language")}
          </Text>

          <Pressable
            onPress={() => setShowLanguageModal(true)}
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Globe size={24} color="#fed319" />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                >
                  {t("language")}
                </Text>
                <Text style={{ color: "#666666", fontSize: 14, marginTop: 2 }}>
                  {currentLang.flag} {currentLang.nativeName}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
        </View>

        {/* Notifications Section */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "#666666",
              fontSize: 12,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            PREFERENCES
          </Text>

          <Pressable
            onPress={() => router.push("/(tabs)/notifications")}
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Bell size={24} color="#fed319" />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                >
                  Notifications
                </Text>
                <Text style={{ color: "#666666", fontSize: 14, marginTop: 2 }}>
                  {user
                    ? "Manage in-app and push alerts"
                    : "Sign in to enable notifications"}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
        </View>

        {/* App URLs Section */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "#666666",
              fontSize: 12,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            APP URLS
          </Text>

          <View style={{ gap: 12 }}>
            {/* App URL */}
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <ExternalLink size={18} color="#4ade80" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  App URL
                </Text>
              </View>
              <Pressable
                onPress={() => copyToClipboard(appUrl, "App URL")}
                style={{
                  backgroundColor: "#111111",
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ color: "#4ade80", fontSize: 13, flex: 1 }}
                  numberOfLines={1}
                >
                  {appUrl}
                </Text>
                <Copy size={18} color="#4ade80" />
              </Pressable>
            </View>

            {/* Admin URL (only if user is admin) */}
            {user?.is_admin && (
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#fbbf24",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <ExternalLink size={18} color="#fbbf24" />
                  <Text
                    style={{
                      color: "#fbbf24",
                      fontSize: 14,
                      fontWeight: "bold",
                      marginLeft: 8,
                    }}
                  >
                    Admin Panel URL
                  </Text>
                </View>
                <Pressable
                  onPress={() => copyToClipboard(adminUrl, "Admin URL")}
                  style={{
                    backgroundColor: "#111111",
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ color: "#fbbf24", fontSize: 13, flex: 1 }}
                    numberOfLines={1}
                  >
                    {adminUrl}
                  </Text>
                  <Copy size={18} color="#fbbf24" />
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Developer Tools Section */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "#666666",
              fontSize: 12,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            DEVELOPER TOOLS
          </Text>

          <Pressable
            onPress={() => router.push("/diagnostics")}
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Database size={24} color="#3b82f6" />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                >
                  Database Diagnostics
                </Text>
                <Text style={{ color: "#666666", fontSize: 14, marginTop: 2 }}>
                  Check database connection status
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
        </View>

        {/* Account Section */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "#666666",
              fontSize: 12,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {t("account")}
          </Text>

          {user ? (
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <User size={24} color="#fed319" />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={{ color: "#666666", fontSize: 12 }}>
                    {t("signedInAs")}
                  </Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "bold",
                      marginTop: 2,
                    }}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => signOut()}
                style={{
                  backgroundColor: "#2a1a1a",
                  padding: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  {t("signOut")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={() => signIn()}
                style={{
                  backgroundColor: "#fed319",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#111111",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {t("signIn")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => signUp()}
                style={{
                  backgroundColor: "#1a1a1a",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#333333",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {t("signUp")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={{ marginTop: 60, alignItems: "center" }}>
          <Text style={{ color: "#666666", fontSize: 12 }}>
            CryptoNews v1.0.0
          </Text>
          <Text style={{ color: "#444444", fontSize: 11, marginTop: 4 }}>
            Made with 🥔 Potato Power
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              {t("selectLanguage")}
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              {t("languageSubtitle")}
            </Text>

            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => changeLanguage(lang.code)}
                  style={{
                    backgroundColor:
                      language === lang.code ? "#fed31920" : "#111111",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: language === lang.code ? 1 : 0,
                    borderColor: "#fed319",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Text style={{ fontSize: 32, marginRight: 16 }}>
                      {lang.flag}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text
                        style={{ color: "#666666", fontSize: 14, marginTop: 2 }}
                      >
                        {lang.name}
                      </Text>
                    </View>
                  </View>
                  {language === lang.code && (
                    <Check size={24} color="#fed319" strokeWidth={3} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
