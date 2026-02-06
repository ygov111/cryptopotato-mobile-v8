import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";

export function PortfolioHeader({ user, userPoints, insets, alerts = [] }) {
  const router = useRouter();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

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

  return (
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
            {t("portfolioTitle")}
          </Text>
          <Text style={{ color: "#999999", fontSize: 14 }}>
            {user ? t("syncedAccount") : t("storedLocally")}
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
  );
}
