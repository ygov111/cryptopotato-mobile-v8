import { useState, useEffect, useCallback, useRef } from "react";
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
import { useTranslatedArticles } from "@/hooks/useTranslatedArticles";
import ShimmerText from "@/components/ShimmerText";

const CATEGORIES = [
  {
    id: "all",
    label: "All News",
    categoryIds: [14810, 48177, 6165, 218, 6167, 6180, 6271],
  },
  { id: "crypto", label: "Crypto News", categoryIds: [14810, 48177] },
  { id: "market", label: "Market", categoryIds: [6165] },
  { id: "analysis", label: "Analysis", categoryIds: [218, 6167, 6180, 6271] },
];

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

export default function News() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const postsByCategory = useRef({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const { data: user } = useUser();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

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
  const rtl = isRTL(language);

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

  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts", user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const {
    data: posts = [],
    isLoading: loadingPosts,
    refetch: refetchPosts,
    isFetching,
  } = useQuery({
    queryKey: ["news", selectedCategory, page],
    queryFn: async () => {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      const categoryParam = category.categoryIds.join(",");

      const response = await fetch(
        `https://cryptopotato.com/wp-json/wp/v2/posts?_embed&sticky=false&per_page=10&page=${page}&categories=${categoryParam}`,
      );

      if (!response.ok) throw new Error("Failed to fetch news");
      return await response.json();
    },
    staleTime: 120000, // Increased from 60s to 2 minutes - news doesn't change that often
    cacheTime: 600000, // Increased from 5min to 10 minutes
  });

  useEffect(() => {
    if (posts && posts.length > 0) {
      setIsInitialLoad(false);
      postsByCategory.current[selectedCategory] =
        postsByCategory.current[selectedCategory] || [];

      if (page === 1) {
        postsByCategory.current[selectedCategory] = posts;
      } else {
        const existing = postsByCategory.current[selectedCategory];
        const existingIds = new Set(existing.map((p) => p.id));
        const newPosts = posts.filter((p) => !existingIds.has(p.id));
        postsByCategory.current[selectedCategory] = [...existing, ...newPosts];
      }
    }
  }, [posts, page, selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const allPosts = postsByCategory.current[selectedCategory] || [];

  const { translatedArticles, loadingTitles } = useTranslatedArticles(
    allPosts,
    language,
  );

  const { data: prices = [] } = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=usd&include_24hr_change=true",
        {
          headers: {
            "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "",
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch prices");
      const data = await response.json();
      return [
        {
          name: "BTC",
          price: data.bitcoin?.usd,
          change: data.bitcoin?.usd_24h_change,
        },
        {
          name: "ETH",
          price: data.ethereum?.usd,
          change: data.ethereum?.usd_24h_change,
        },
        {
          name: "SOL",
          price: data.solana?.usd,
          change: data.solana?.usd_24h_change,
        },
        {
          name: "ADA",
          price: data.cardano?.usd,
          change: data.cardano?.usd_24h_change,
        },
      ];
    },
    refetchInterval: 30000,
    staleTime: 20000,
    cacheTime: 300000,
  });

  const topStory = translatedArticles.find((post) =>
    post.categories?.includes(48177),
  );
  const regularPosts = translatedArticles.filter(
    (post) => post.id !== topStory?.id,
  );

  const feedItems = [];
  if (topStory) {
    const topStoryIndex = allPosts.findIndex((p) => p.id === topStory.id);
    feedItems.push({
      type: "topStory",
      data: topStory,
      isLoading: loadingTitles.has(topStory.id),
    });
  }

  regularPosts.forEach((post, index) => {
    const postIndex = allPosts.findIndex((p) => p.id === post.id);
    feedItems.push({
      type: "post",
      data: post,
      isLoading: loadingTitles.has(post.id),
    });
    if ((index + 1) % 4 === 0)
      feedItems.push({ type: "priceTicker", data: prices, language });
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetchPosts();
    setRefreshing(false);
  }, [refetchPosts]);

  const handleLoadMore = () => {
    if (!isFetching) setPage((prev) => prev + 1);
  };

  const showLoading =
    isInitialLoad && loadingPosts && translatedArticles.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 15,
          borderBottomWidth: 1,
          borderColor: "#222222",
        }}
      >
        <View
          style={{
            flexDirection: rtl ? "row-reverse" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
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
              <Text
                style={{
                  fontSize: 20,
                  marginRight: rtl ? 0 : 6,
                  marginLeft: rtl ? 6 : 0,
                }}
              >
                🥔
              </Text>
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
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  selectedCategory === category.id ? "#fed319" : "#1a1a1a",
                marginRight: 10,
              }}
            >
              <Text
                style={{
                  color:
                    selectedCategory === category.id ? "#111111" : "#999999",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {t(
                  category.id === "all"
                    ? "allNews"
                    : category.id === "crypto"
                      ? "cryptoNews"
                      : category.id,
                )}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fed319"
          />
        }
      >
        {showLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#fed319" />
          </View>
        ) : translatedArticles.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text
              style={{ color: "#666666", fontSize: 16, textAlign: "center" }}
            >
              {t("noArticles")}
            </Text>
          </View>
        ) : (
          <>
            {feedItems.map((item, index) => {
              if (item.type === "topStory")
                return (
                  <TopStoryCard
                    key={`top-${item.data.id}`}
                    post={item.data}
                    isLoading={item.isLoading}
                    rtl={rtl}
                    language={language}
                  />
                );
              if (item.type === "priceTicker")
                return (
                  <PriceTicker
                    key={`ticker-${index}`}
                    prices={item.data}
                    rtl={rtl}
                    language={item.language}
                  />
                );
              return (
                <NewsCard
                  key={item.data.id}
                  post={item.data}
                  isLoading={item.isLoading}
                  rtl={rtl}
                  language={language}
                />
              );
            })}

            {allPosts.length >= 10 && (
              <Pressable
                onPress={handleLoadMore}
                disabled={isFetching}
                style={{
                  marginHorizontal: 20,
                  marginTop: 10,
                  marginBottom: 20,
                  backgroundColor: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "#fed319",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                {isFetching ? (
                  <ActivityIndicator color="#fed319" />
                ) : (
                  <Text
                    style={{
                      color: "#fed319",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {t("loadMore")}
                  </Text>
                )}
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TopStoryCard({ post, isLoading, rtl, language }) {
  const router = useRouter();
  const t = (key) => getUIText(key, language);

  const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const title = decodeHtmlEntities(
    post.translatedTitle || post.title?.rendered,
  );
  const articleUrl = post.link;
  const timeAgo = formatTimeAgo(post.date);
  const author = post._embedded?.author?.[0]?.name || "CryptoPotato";

  return (
    <Pressable
      onPress={() => {
        router.push({
          pathname: "/(tabs)/article",
          params: {
            url: encodeURIComponent(articleUrl),
            title: encodeURIComponent(post.title?.rendered || ""),
            content: encodeURIComponent(post.content?.rendered || ""),
            imageUrl: encodeURIComponent(imageUrl || ""),
            author: encodeURIComponent(author),
            date: encodeURIComponent(post.date),
          },
        });
      }}
      style={{ marginBottom: 20, position: "relative" }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: 250 }}
        resizeMode="cover"
      />
      <View
        style={{
          position: "absolute",
          top: 15,
          left: rtl ? undefined : 15,
          right: rtl ? 15 : undefined,
        }}
      >
        <View
          style={{
            backgroundColor: "#fed319",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#111111", fontSize: 12, fontWeight: "bold" }}>
            {t("topStory")}
          </Text>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 20,
        }}
      >
        <ShimmerText
          isLoading={isLoading}
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {title}
        </ShimmerText>
        <Text
          style={{
            color: "#fed319",
            fontSize: 12,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {timeAgo}
        </Text>
      </View>
    </Pressable>
  );
}

function NewsCard({ post, isLoading, rtl, language }) {
  const router = useRouter();
  const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const title = decodeHtmlEntities(
    post.translatedTitle || post.title?.rendered,
  );
  const excerpt =
    decodeHtmlEntities(post.excerpt?.rendered).substring(0, 100) + "...";
  const articleUrl = post.link;
  const timeAgo = formatTimeAgo(post.date);
  const author = post._embedded?.author?.[0]?.name || "CryptoPotato";

  return (
    <Pressable
      onPress={() => {
        router.push({
          pathname: "/(tabs)/article",
          params: {
            url: encodeURIComponent(articleUrl),
            title: encodeURIComponent(post.title?.rendered || ""),
            content: encodeURIComponent(post.content?.rendered || ""),
            imageUrl: encodeURIComponent(imageUrl || ""),
            author: encodeURIComponent(author),
            date: encodeURIComponent(post.date),
          },
        });
      }}
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        overflow: "hidden",
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
        <ShimmerText
          isLoading={isLoading}
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: rtl ? "right" : "left",
          }}
        >
          {title}
        </ShimmerText>
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
}

function PriceTicker({ prices, rtl, language }) {
  const t = (key) => getUIText(key, language);

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: "#fed319",
      }}
    >
      <Text
        style={{
          color: "#fed319",
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 12,
          textAlign: rtl ? "right" : "left",
        }}
      >
        {t("livePrices")}
      </Text>
      <View
        style={{
          flexDirection: rtl ? "row-reverse" : "row",
          justifyContent: "space-between",
        }}
      >
        {prices.map((coin, index) => (
          <View key={index} style={{ alignItems: "center" }}>
            <Text style={{ color: "#999999", fontSize: 11, marginBottom: 4 }}>
              {coin.name}
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 2,
              }}
            >
              ${coin.price?.toLocaleString()}
            </Text>
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
              }}
            >
              {coin.change >= 0 ? (
                <TrendingUp size={12} color="#10b981" />
              ) : (
                <TrendingDown size={12} color="#ef4444" />
              )}
              <Text
                style={{
                  color: coin.change >= 0 ? "#10b981" : "#ef4444",
                  fontSize: 11,
                  marginLeft: rtl ? 0 : 2,
                  marginRight: rtl ? 2 : 0,
                }}
              >
                {Math.abs(coin.change).toFixed(2)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
