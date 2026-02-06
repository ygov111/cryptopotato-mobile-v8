import { Tabs, useRouter } from "expo-router";
import {
  Home,
  Newspaper,
  Briefcase,
  TrendingUp,
  Gift,
  Settings,
  Bell,
} from "lucide-react-native";
import { View, Text, Pressable, Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUser from "@/utils/auth/useUser";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBackgroundPriceChecker } from "@/hooks/useBackgroundPriceChecker";

function PotatoPointsHeader() {
  const router = useRouter();
  const { data: user } = useUser();

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
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/rewards")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1a1a1a",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#fed319",
        marginRight: 16,
      }}
    >
      <Text style={{ fontSize: 18, marginRight: 6 }}>🥔</Text>
      <Text style={{ color: "#fed319", fontSize: 14, fontWeight: "bold" }}>
        {userPoints || 0}
      </Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  // Initialize background price checker
  useBackgroundPriceChecker();

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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopWidth: 1,
          borderColor: "#222222",
          paddingTop: 4,
          paddingBottom:
            Platform.OS === "android" ? insets.bottom + 8 : insets.bottom,
          height:
            Platform.OS === "android" ? 65 + insets.bottom : 60 + insets.bottom,
        },
        tabBarActiveTintColor: "#fed319",
        tabBarInactiveTintColor: "#666666",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t("tabNews"),
          tabBarIcon: ({ color }) => <Newspaper color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: t("tabPortfolio"),
          tabBarIcon: ({ color }) => <Briefcase color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: t("tabMarket"),
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t("tabRewards"),
          tabBarIcon: ({ color }) => <Gift color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabSettings"),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar - accessible via Settings only
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          href: null, // Hide from tab bar - accessible via navigation only
        }}
      />
      <Tabs.Screen
        name="article"
        options={{
          href: null, // Hide from tab bar - this is a detail screen
        }}
      />
      <Tabs.Screen
        name="webview"
        options={{
          href: null, // Hide from tab bar - this is for external links
        }}
      />
    </Tabs>
  );
}
