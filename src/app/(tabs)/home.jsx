import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUser from "@/utils/auth/useUser";
import { getUIText, DEFAULT_LANGUAGE, isRTL } from "@/utils/i18n";
import DailyQuestCard from "@/components/Gamification/DailyQuestCard";
import MagicCoinCard from "@/components/Gamification/MagicCoinCard";
import { fetchCryptoPrices } from "@/utils/workerApi";
import { apiFetch } from "@/utils/fetchHelper";

// Decode HTML entities
function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, "");
}

// Format time ago
function formatTimeAgo(dateString) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return postDate.toUTCString().replace("GMT", "UTC");
}

export default function MyCoins() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useUser();
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
  const rtl = isRTL(language);

  // Fetch user points with aggressive refresh
  const { data: userPoints, refetch: refetchPoints } = useQuery({
    queryKey: ["userPoints", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/rewards/get");
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

  // Fetch portfolio
  const { data: portfolio = [], isLoading: loadingPortfolio } = useQuery({
    queryKey: ["portfolio", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/portfolio/list", {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch portfolio");
        const data = await response.json();
        return data.portfolio || [];
      } else {
        const stored = await AsyncStorage.getItem("portfolio");
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  // Fetch prices for portfolio coins using Worker API (with cache)
  const { data: prices = {}, isLoading: loadingPrices } = useQuery({
    queryKey: ["portfolioPrices", portfolio],
    queryFn: async () => {
      if (portfolio.length === 0) return {};
      const coinIds = portfolio.map((p) => p.coin_id || p.coinId).join(",");

      // Use Worker API with automatic fallback and cache (same as market/portfolio tabs)
      const data = await fetchCryptoPrices(coinIds);
      return data;
    },
    enabled: portfolio.length > 0,
    refetchInterval: 30000, // 30 seconds
    staleTime: 20000, // Keep data fresh for 20 seconds
    cacheTime: 300000, // Cache for 5 minutes
  });

  // Fetch news filtered by portfolio coins
  const {
    data: filteredNews = [],
    isLoading: loadingNews,
    refetch: refetchNews,
  } = useQuery({
    queryKey: ["myCoinsNews", portfolio],
    queryFn: async () => {
      if (portfolio.length === 0) return [];

      const response = await fetch(
        `https://cryptopotato.com/wp-json/wp/v2/posts?_embed&per_page=50&categories=14810,48177,6165,218,6167,6180,6271`,
      );

      if (!response.ok) throw new Error("Failed to fetch news");
      const allPosts = await response.json();

      const coinKeywords = portfolio.flatMap((asset) => {
        const coinName = (asset.coin_name || asset.coinName).toLowerCase();
        const variations = [coinName];

        if (coinName.includes("bitcoin")) variations.push("btc");
        if (coinName.includes("ethereum")) variations.push("eth");
        if (coinName.includes("solana")) variations.push("sol");
        if (coinName.includes("cardano")) variations.push("ada");
        if (coinName.includes("ripple") || coinName.includes("xrp"))
          variations.push("xrp", "ripple");
        if (coinName.includes("dogecoin")) variations.push("doge");
        if (coinName.includes("polkadot")) variations.push("dot");

        return variations;
      });

      const filtered = allPosts.filter((post) => {
        const title = decodeHtmlEntities(post.title?.rendered).toLowerCase();
        const excerpt = decodeHtmlEntities(
          post.excerpt?.rendered,
        ).toLowerCase();
        const content = title + " " + excerpt;

        return coinKeywords.some((keyword) => content.includes(keyword));
      });

      return filtered;
    },
    enabled: portfolio.length > 0,
  });

  // Fetch daily quest
  const { data: questData, refetch: refetchQuest } = useQuery({
    queryKey: ["dailyQuest"],
    queryFn: async () => {
      const response = await apiFetch("/api/quest/get");
      if (!response.ok) throw new Error("Failed to fetch quest");
      const data = await response.json();
      console.log("🎯 Daily Quest Fetched:", {
        hasQuest: !!data.quest,
        question: data.quest?.question,
        articleTitle: data.quest?.articleTitle,
        articleUrl: data.quest?.articleUrl,
      });
      return data;
    },
    refetchInterval: 60000,
  });

  // Fetch magic coin status
  const { data: magicCoinData, refetch: refetchMagicCoin } = useQuery({
    queryKey: ["magicCoin"],
    queryFn: async () => {
      const response = await apiFetch("/api/magic-coin/status");
      if (!response.ok) throw new Error("Failed to fetch magic coin status");
      return await response.json();
    },
    refetchInterval: 60000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchNews(), refetchQuest(), refetchMagicCoin()]);
    setRefreshing(false);
  }, [refetchNews, refetchQuest, refetchMagicCoin]);

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
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Image
          source={{
            uri: "https://ucarecdn.com/1c212a66-838f-4b36-9110-7b1e37c2c690/-/format/auto/",
          }}
          style={{ width: 160, height: 40 }}
          resizeMode="contain"
        />

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fed319"
          />
        }
      >
        {/* Daily Gamification Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <DailyQuestCard
            quest={questData?.quest}
            attempted={questData?.attempted}
            wasCorrect={questData?.wasCorrect}
            loading={!questData}
          />

          {magicCoinData && <MagicCoinCard status={magicCoinData} />}
        </View>

        {loadingPortfolio ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#fed319" />
          </View>
        ) : portfolio.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text
              style={{
                color: "#666666",
                fontSize: 16,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {t("noAssets")}
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/portfolio")}
              style={{
                backgroundColor: "#fed319",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ color: "#111111", fontSize: 16, fontWeight: "bold" }}
              >
                {t("portfolioTitle")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {t("yourAssets")}
                </Text>
                <Text
                  style={{
                    color: "#fed319",
                    fontSize: 14,
                  }}
                >
                  {t("swipeToSeeMore")}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, marginBottom: 10 }}
              >
                {portfolio.map((asset, index) => {
                  const coinId = asset.coin_id || asset.coinId;
                  const currentPrice = prices[coinId]?.usd || 0;
                  const change = prices[coinId]?.usd_24h_change || 0;
                  const ticker =
                    asset.symbol ||
                    (asset.coin_name || asset.coinName)
                      .split(" ")[0]
                      .toUpperCase();

                  return (
                    <View
                      key={asset.id || index}
                      style={{
                        backgroundColor: "#1a1a1a",
                        borderRadius: 12,
                        padding: 16,
                        marginRight: 12,
                        minWidth: 120,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 20,
                          fontWeight: "bold",
                          marginBottom: 8,
                        }}
                      >
                        {ticker}
                      </Text>
                      {loadingPrices ? (
                        <ActivityIndicator
                          size="small"
                          color="#fed319"
                          style={{ marginVertical: 8 }}
                        />
                      ) : (
                        <>
                          <Text
                            style={{
                              color: "white",
                              fontSize: 16,
                              marginBottom: 8,
                            }}
                          >
                            ${currentPrice.toLocaleString()}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            {change >= 0 ? (
                              <TrendingUp size={14} color="#10b981" />
                            ) : (
                              <TrendingDown size={14} color="#ef4444" />
                            )}
                            <Text
                              style={{
                                color: change >= 0 ? "#10b981" : "#ef4444",
                                fontSize: 12,
                                marginLeft: 4,
                              }}
                            >
                              {change >= 0 ? "+" : ""}
                              {change.toFixed(2)}%
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 15,
                }}
              >
                {t("featuredArticles")}
              </Text>

              {loadingNews ? (
                <ActivityIndicator
                  size="large"
                  color="#fed319"
                  style={{ marginTop: 40 }}
                />
              ) : filteredNews.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text
                    style={{
                      color: "#666666",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    {t("noArticles")}
                  </Text>
                </View>
              ) : (
                filteredNews.map((post, index) => {
                  const imageUrl =
                    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  const title = decodeHtmlEntities(post.title?.rendered);
                  const excerpt =
                    decodeHtmlEntities(post.excerpt?.rendered).substring(
                      0,
                      100,
                    ) + "...";
                  const timeAgo = formatTimeAgo(post.date);
                  const author =
                    post._embedded?.author?.[0]?.name || "CryptoPotato";

                  return (
                    <Pressable
                      key={post.id}
                      onPress={() => {
                        router.push({
                          pathname: "/(tabs)/article",
                          params: {
                            url: encodeURIComponent(post.link),
                            title: encodeURIComponent(
                              post.title?.rendered || "",
                            ),
                            content: encodeURIComponent(
                              post.content?.rendered || "",
                            ),
                            imageUrl: encodeURIComponent(imageUrl || ""),
                            author: encodeURIComponent(author),
                            date: encodeURIComponent(post.date),
                          },
                        });
                      }}
                      style={{
                        backgroundColor: "#1a1a1a",
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 15,
                      }}
                    >
                      {imageUrl && (
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ width: "100%", height: 180 }}
                          resizeMode="cover"
                        />
                      )}

                      <View style={{ padding: 15 }}>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "bold",
                            marginBottom: 8,
                            textAlign: rtl ? "right" : "left",
                          }}
                        >
                          {title}
                        </Text>
                        {language === "en" && (
                          <Text
                            style={{
                              color: "#999999",
                              fontSize: 14,
                              lineHeight: 20,
                              marginBottom: 8,
                              textAlign: rtl ? "right" : "left",
                            }}
                          >
                            {excerpt}
                          </Text>
                        )}
                        <Text
                          style={{
                            color: "#666666",
                            fontSize: 12,
                            textAlign: rtl ? "right" : "left",
                          }}
                        >
                          {timeAgo}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
