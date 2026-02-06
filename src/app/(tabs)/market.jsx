import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Bell,
  X,
  BellOff,
  Briefcase,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUser from "@/utils/auth/useUser";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";
import { useRouter } from "expo-router";

export default function Market() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
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

  // Fetch market data from CoinGecko
  const {
    data: marketData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["marketData"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
          {
            headers: {
              "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch market data: ${response.status}`);
        }

        const data = await response.json();

        const validCoins = data.filter(
          (coin) =>
            coin.price_change_percentage_24h !== null &&
            coin.price_change_percentage_24h !== undefined,
        );

        const top20 = data.slice(0, 20);

        const sorted = [...validCoins].sort(
          (a, b) =>
            b.price_change_percentage_24h - a.price_change_percentage_24h,
        );

        const gainers = sorted
          .filter((coin) => coin.price_change_percentage_24h > 0)
          .slice(0, 5);

        const allNegative = sorted.filter(
          (coin) => coin.price_change_percentage_24h < 0,
        );
        const losers = allNegative.slice(-5).reverse();

        return { top20, gainers, losers };
      } catch (err) {
        console.error("❌ Market data fetch error:", err);
        throw err;
      }
    },
    refetchInterval: 300000,
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

  // Check alerts against current prices
  useEffect(() => {
    if (!marketData || !alerts.length) return;

    const allCoins = [
      ...marketData.top20,
      ...marketData.gainers,
      ...marketData.losers,
    ];

    alerts.forEach((alert) => {
      const coin = allCoins.find((c) => c.id === alert.coinId);
      if (!coin) return;

      const currentPrice = coin.current_price;
      const triggered =
        (alert.direction === "above" && currentPrice >= alert.targetPrice) ||
        (alert.direction === "below" && currentPrice <= alert.targetPrice);

      if (triggered) {
        const directionText =
          alert.direction === "above" ? "went above" : "went below";
        Alert.alert(
          `${t("priceAlerts")}!`,
          `${coin.name} ${directionText} $${alert.targetPrice.toLocaleString()}`,
        );
        // Remove only this specific alert by matching createdAt timestamp
        removeSpecificAlert(alert.createdAt);
      }
    });
  }, [marketData, alerts]);

  const handleSetAlert = (coin) => {
    // Check if alerts already exist for this coin
    const existingAlerts = alerts.filter((a) => a.coinId === coin.id);

    if (existingAlerts.length > 0) {
      // Navigate to alerts page filtered to this coin
      router.push({
        pathname: "/(tabs)/alerts",
        params: { coinId: coin.id },
      });
    } else {
      // No existing alerts, create new one
      setSelectedCoin(coin);
      setTargetPrice(coin.current_price.toString());
      setAlertDirection("above");
      setShowAlertModal(true);
    }
  };

  const saveAlert = async () => {
    if (!selectedCoin || !targetPrice) return;

    const currentPrice = selectedCoin.current_price;
    const target = parseFloat(targetPrice);

    // Validate alert logic
    if (alertDirection === "above" && currentPrice >= target) {
      setShowAlertModal(false);
      setTimeout(() => {
        Alert.alert(
          "Invalid Alert",
          `Cannot set "above" alert. Current price ($${currentPrice.toLocaleString()}) is already above or equal to target ($${target.toLocaleString()}).`,
        );
      }, 300);
      return;
    }

    if (alertDirection === "below" && currentPrice <= target) {
      setShowAlertModal(false);
      setTimeout(() => {
        Alert.alert(
          "Invalid Alert",
          `Cannot set "below" alert. Current price ($${currentPrice.toLocaleString()}) is already below or equal to target ($${target.toLocaleString()}).`,
        );
      }, 300);
      return;
    }

    const newAlert = {
      coinId: selectedCoin.id,
      coinName: selectedCoin.name,
      symbol: selectedCoin.symbol.toUpperCase(),
      targetPrice: target,
      direction: alertDirection,
      createdAt: Date.now(),
    };

    const updated = [...alerts, newAlert];
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });

    setShowAlertModal(false);
    setSelectedCoin(null);
    setTargetPrice("");
    setAlertDirection("above");

    setTimeout(() => {
      Alert.alert("Success", "Price alert created!");
    }, 300);
  };

  const removeAlert = async (coinId) => {
    const updated = alerts.filter((a) => a.coinId !== coinId);
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
  };

  const removeSpecificAlert = async (createdAt) => {
    const updated = alerts.filter((a) => a.createdAt !== createdAt);
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
  };

  const addToPortfolioMutation = useMutation({
    mutationFn: async (coin) => {
      if (user?.id) {
        const response = await fetch("/api/portfolio/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coin_name: coin.name,
            coin_id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            amount: null,
            buy_price: null,
          }),
        });

        if (response.status === 409) {
          throw new Error("DUPLICATE");
        }

        if (!response.ok) throw new Error("Failed to add to portfolio");
        return await response.json();
      } else {
        const stored = await AsyncStorage.getItem("portfolio");
        const portfolio = stored ? JSON.parse(stored) : [];

        const isDuplicate = portfolio.some(
          (p) => (p.coin_id || p.coinId) === coin.id,
        );

        if (isDuplicate) {
          throw new Error("DUPLICATE");
        }

        const maxOrder =
          portfolio.length > 0
            ? Math.max(...portfolio.map((p) => p.display_order || 0))
            : -1;
        const newPortfolio = [
          ...portfolio,
          {
            id: Date.now(),
            coin_name: coin.name,
            coinId: coin.id,
            symbol: coin.symbol.toUpperCase(),
            amount: null,
            buyPrice: null,
            display_order: maxOrder + 1,
          },
        ];
        await AsyncStorage.setItem("portfolio", JSON.stringify(newPortfolio));
        return newPortfolio;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      Alert.alert("Success", "Coin added to your portfolio!");
    },
    onError: (error) => {
      if (error.message === "DUPLICATE") {
        Alert.alert(
          "Duplicate Coin",
          "This coin is already in your portfolio!",
        );
      } else {
        Alert.alert("Error", "Failed to add coin to portfolio");
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatMarketCap = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else if (price >= 0.01) {
      return price.toFixed(4);
    } else if (price >= 0.0001) {
      return price.toFixed(6);
    } else {
      return price.toFixed(8);
    }
  };

  const CoinRow = ({ coin, rank, showRank = true }) => (
    <View
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            {showRank && (
              <Text
                style={{
                  color: "#666666",
                  fontSize: 14,
                  marginRight: 8,
                  width: 30,
                }}
              >
                #{rank}
              </Text>
            )}
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                marginRight: 8,
              }}
            >
              {coin.symbol.toUpperCase()}
            </Text>
            <Text style={{ color: "#666666", fontSize: 14 }}>{coin.name}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <Text style={{ color: "#999999", fontSize: 12 }}>
              {t("marketCap")}: {formatMarketCap(coin.market_cap)}
            </Text>
            <Text style={{ color: "#999999", fontSize: 12 }}>
              {t("volume")}: {formatVolume(coin.total_volume)}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
            ${formatPrice(coin.current_price)}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
          >
            {coin.price_change_percentage_24h !== null &&
            coin.price_change_percentage_24h !== undefined ? (
              <>
                {coin.price_change_percentage_24h >= 0 ? (
                  <TrendingUp size={14} color="#10b981" />
                ) : (
                  <TrendingDown size={14} color="#ef4444" />
                )}
                <Text
                  style={{
                    color:
                      coin.price_change_percentage_24h >= 0
                        ? "#10b981"
                        : "#ef4444",
                    fontSize: 14,
                    fontWeight: "bold",
                    marginLeft: 4,
                  }}
                >
                  {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </Text>
              </>
            ) : (
              <Text style={{ color: "#666666", fontSize: 14 }}>N/A</Text>
            )}
          </View>
        </View>
      </View>

      <View
        style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={() => addToPortfolioMutation.mutate(coin)}
          style={{
            backgroundColor: "#fed319",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 4,
          }}
        >
          <Plus size={16} color="#111111" strokeWidth={2.5} />
          <Briefcase size={16} color="#111111" strokeWidth={2.5} />
        </Pressable>

        <Pressable
          onPress={() => handleSetAlert(coin)}
          style={{
            backgroundColor: "#2a2a2a",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bell size={16} color="#fed319" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#fed319" />
        <Text style={{ color: "#666666", marginTop: 16 }}>{t("loading")}</Text>
      </View>
    );
  }

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
              {t("marketTitle")}
            </Text>
            <Text style={{ color: "#999999", fontSize: 14 }}>
              {t("marketSubtitle")}
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fed319"
          />
        }
      >
        <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 15,
            }}
          >
            {t("topGainers")}
          </Text>
          {marketData?.gainers.map((coin) => (
            <CoinRow key={coin.id} coin={coin} showRank={false} />
          ))}
        </View>

        <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 15,
            }}
          >
            {t("topLosers")}
          </Text>
          {marketData?.losers.map((coin) => (
            <CoinRow key={coin.id} coin={coin} showRank={false} />
          ))}
        </View>

        <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 15,
            }}
          >
            {t("topCoins")}
          </Text>
          {marketData?.top20.map((coin, index) => (
            <CoinRow key={coin.id} coin={coin} rank={index + 1} />
          ))}
        </View>

        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 20 }}>
          <Text style={{ color: "#666666", fontSize: 12 }}>
            {t("lastUpdated")}: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAlertModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAlertModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
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
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 22, fontWeight: "bold" }}
                >
                  {t("setPriceAlert")}
                </Text>
                <Pressable onPress={() => setShowAlertModal(false)}>
                  <X size={28} color="#999999" />
                </Pressable>
              </View>

              {selectedCoin && (
                <View
                  style={{
                    backgroundColor: "#111111",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                  >
                    {selectedCoin.symbol.toUpperCase()}
                  </Text>
                  <Text style={{ color: "#666666", fontSize: 14 }}>
                    {selectedCoin.name}
                  </Text>
                  <Text
                    style={{ color: "#999999", fontSize: 12, marginTop: 4 }}
                  >
                    {t("currentPrice")}: $
                    {selectedCoin.current_price.toLocaleString()}
                  </Text>
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: "#999999",
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  {t("notifyWhen")}
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setAlertDirection("above")}
                    style={{
                      flex: 1,
                      backgroundColor:
                        alertDirection === "above" ? "#fed319" : "#2a2a2a",
                      padding: 16,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          alertDirection === "above" ? "#111111" : "#999999",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      {t("goesAbove")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAlertDirection("below")}
                    style={{
                      flex: 1,
                      backgroundColor:
                        alertDirection === "below" ? "#fed319" : "#2a2a2a",
                      padding: 16,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          alertDirection === "below" ? "#111111" : "#999999",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      {t("goesBelow")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#999999",
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  {t("targetPrice")}
                </Text>
                <TextInput
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  placeholder="Enter target price..."
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: "#111111",
                    color: "white",
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 16,
                  }}
                />
              </View>

              <Pressable
                onPress={saveAlert}
                disabled={!targetPrice}
                style={{
                  backgroundColor: targetPrice ? "#fed319" : "#333333",
                  padding: 18,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: targetPrice ? "#111111" : "#666666",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {t("saveAlert")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
