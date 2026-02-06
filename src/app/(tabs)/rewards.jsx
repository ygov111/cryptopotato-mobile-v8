import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUser from "@/utils/auth/useUser";
import { useAuth } from "@/utils/auth/useAuth";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";
import { Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import MyRankCard from "@/components/Leaderboard/MyRankCard";
import LeaderboardList from "@/components/Leaderboard/LeaderboardList";
import PrizesList from "@/components/Leaderboard/PrizesList";
import { apiFetch } from "@/utils/fetchHelper";

export default function Rewards() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { signUp } = useAuth();
  const router = useRouter();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showBanner, setShowBanner] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [activeTab, setActiveTab] = useState("rewards"); // "rewards", "leaderboard", "prizes"

  const loadLanguage = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem("userLanguage");
      if (saved) setLanguage(saved);
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  }, []);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const t = (key) => getUIText(key, language);

  // Fetch points
  const { data: pointsData } = useQuery({
    queryKey: ["points", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/rewards/get");
        if (!response.ok) throw new Error("Failed to fetch points");
        return await response.json();
      } else {
        const stored = await AsyncStorage.getItem("points");
        return stored ? JSON.parse(stored) : { points: 0, lastClaimAt: null };
      }
    },
  });

  const points = pointsData?.points || 0;
  const lastClaimAt = pointsData?.lastClaimAt || pointsData?.last_claim_at;

  useEffect(() => {
    if (!user && points >= 20) setShowBanner(true);
  }, [user, points]);

  const canClaim = () => {
    if (!lastClaimAt) return true;
    const lastClaim = new Date(lastClaimAt);
    const now = new Date();
    const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
    return hoursSinceLastClaim >= 24;
  };

  const getTimeUntilNextClaim = () => {
    if (!lastClaimAt) return null;
    const lastClaim = new Date(lastClaimAt);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = nextClaim - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/rewards/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to claim points");
        return await response.json();
      } else {
        const newPoints = points + 10;
        const newData = {
          points: newPoints,
          lastClaimAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem("points", JSON.stringify(newData));
        return newData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points"] });
      queryClient.invalidateQueries({ queryKey: ["userPoints"] });

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    },
  });

  const handleClaim = () => {
    if (canClaim()) claimMutation.mutate();
  };

  const timeUntilNext = getTimeUntilNextClaim();

  // Load price alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts", user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
  });

  // Dynamic header based on active tab
  const getHeaderContent = () => {
    switch (activeTab) {
      case "rewards":
        return {
          title: t("rewardsTitle"),
          subtitle: t("rewardsSubtitle"),
        };
      case "leaderboard":
        return {
          title: "Leaderboard",
          subtitle: "Top 100 potato collectors",
        };
      case "prizes":
        return {
          title: "Prizes",
          subtitle: "Win amazing rewards",
        };
      default:
        return {
          title: t("rewardsTitle"),
          subtitle: t("rewardsSubtitle"),
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "#111111",
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
            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
              {headerContent.title}
            </Text>
            <Text style={{ color: "#999999", fontSize: 14, marginTop: 5 }}>
              {headerContent.subtitle}
            </Text>
          </View>

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

        {/* Tab Navigation */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 20,
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            padding: 4,
          }}
        >
          <Pressable
            onPress={() => setActiveTab("rewards")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor:
                activeTab === "rewards" ? "#fed319" : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: activeTab === "rewards" ? "bold" : "600",
                color: activeTab === "rewards" ? "#111111" : "#999999",
              }}
            >
              🥔 Rewards
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("leaderboard")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor:
                activeTab === "leaderboard" ? "#fed319" : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: activeTab === "leaderboard" ? "bold" : "600",
                color: activeTab === "leaderboard" ? "#111111" : "#999999",
              }}
            >
              🏆 Leaderboard
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("prizes")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor:
                activeTab === "prizes" ? "#fed319" : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: activeTab === "prizes" ? "bold" : "600",
                color: activeTab === "prizes" ? "#111111" : "#999999",
              }}
            >
              🎁 Prizes
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === "rewards" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner for non-logged users */}
          {showBanner && (
            <Pressable
              onPress={() => signUp()}
              style={{
                backgroundColor: "#fed319",
                marginHorizontal: 20,
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#111111",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {t("dontLoseSpuds")}
                </Text>
                <Text style={{ color: "#111111", fontSize: 14 }}>
                  {t("createAccountSecure")}
                </Text>
              </View>
              <Text style={{ color: "#111111", fontSize: 24, marginLeft: 10 }}>
                🥔
              </Text>
            </Pressable>
          )}

          {/* Potato Claim Section */}
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 40,
            }}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={handleClaim}
                disabled={!canClaim() || claimMutation.isPending}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: canClaim() ? "#fed319" : "#333333",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 40,
                }}
              >
                <Text style={{ fontSize: 100 }}>🥔</Text>
              </Pressable>
            </Animated.View>

            <Text
              style={{
                color: "white",
                fontSize: 48,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              {points}
            </Text>
            <Text
              style={{
                color: "#fed319",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 30,
              }}
            >
              {t("potatoPoints")}
            </Text>

            {canClaim() ? (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: "#10b981",
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  ✓ {t("readyToClaim")}
                </Text>
                <Text style={{ color: "#999999", fontSize: 14 }}>
                  {t("tapPotatoEarn")}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: "#666666",
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  {t("comeBackIn")} {timeUntilNext}
                </Text>
                <Text style={{ color: "#999999", fontSize: 14 }}>
                  {t("comeBackTomorrow")}
                </Text>
              </View>
            )}
          </View>

          {/* How It Works */}
          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 12,
                }}
              >
                {t("howItWorks")}
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>🥔</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  {t("claim10Points")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>📖</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  Read articles to earn points (1st: +5pts, 2nd: +5pts, 3rd:
                  +10pts daily bonus)
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>🔔</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  Set price alerts to track your favorite coins
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>💼</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  Add coins to your portfolio to track gains & losses
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>🌐</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  Translate articles to read crypto news in your language
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>💰</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  {t("buildStash")}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ color: "#fed319", marginRight: 8 }}>🎁</Text>
                <Text style={{ color: "#999999", fontSize: 14, flex: 1 }}>
                  {t("createAccountAt20")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === "leaderboard" && (
        <View style={{ flex: 1 }}>
          {user && <MyRankCard />}
          <LeaderboardList />
        </View>
      )}

      {activeTab === "prizes" && <PrizesList />}
    </View>
  );
}
