import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import useUser from "@/utils/auth/useUser";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";
import { apiFetch } from "@/utils/fetchHelper";
import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioPrices } from "@/hooks/usePortfolioPrices";
import { useUserPoints } from "@/hooks/useUserPoints";
import { calculatePortfolioStats } from "@/utils/portfolioCalculations";
import { PortfolioHeader } from "@/components/Portfolio/PortfolioHeader";
import { PortfolioStats } from "@/components/Portfolio/PortfolioStats";
import { AssetList } from "@/components/Portfolio/AssetList";
import { AddAssetModal } from "@/components/Portfolio/AddAssetModal";
import { AddAssetButton } from "@/components/Portfolio/AddAssetButton";
import { EditAssetModal } from "@/components/Portfolio/EditAssetModal";
import { X } from "lucide-react-native";

export default function Portfolio() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [alertDirection, setAlertDirection] = useState("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);

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

  const userPoints = useUserPoints(user);

  // Load price alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts", user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (user?.id) {
      apiFetch("/api/portfolio/backfill-symbols", { method: "POST" })
        .then((response) => response.json())
        .then((data) => {
          if (data.updated > 0)
            queryClient.invalidateQueries({ queryKey: ["portfolio"] });
        })
        .catch((err) => console.error("Failed to backfill symbols:", err));
    }
  }, [user?.id, queryClient]);

  const {
    portfolio,
    isLoading,
    deleteAssetMutation,
    reorderMutation,
    addAssetMutation,
    editAssetMutation,
  } = usePortfolio(user);

  const { prices, loadingPrices } = usePortfolioPrices(portfolio);

  const stats = calculatePortfolioStats(portfolio, prices);

  const handleAddAsset = (asset) => {
    addAssetMutation.mutate(asset, {
      onSuccess: () => {
        setShowAddModal(false);
      },
    });
  };

  const handleReorder = (id, direction) => {
    reorderMutation.mutate({ id, direction });
  };

  const handleDelete = (id) => {
    deleteAssetMutation.mutate(id);
  };

  const handleEdit = (asset) => {
    setShowEditModal(true);
    setSelectedAsset(asset);
  };

  const handleSetAlert = (asset) => {
    setSelectedAsset(asset);
    const coinId = asset.coin_id || asset.coinId;

    // Check if alerts already exist for this coin
    const existingAlerts = alerts.filter((a) => a.coinId === coinId);

    if (existingAlerts.length > 0) {
      // Navigate to alerts page filtered to this coin
      router.push({
        pathname: "/(tabs)/alerts",
        params: { coinId },
      });
    } else {
      // No existing alerts, create new one
      const currentPrice = prices[coinId]?.usd || 0;
      setTargetPrice(currentPrice.toString());
      setAlertDirection("above");
      setShowAlertModal(true);
    }
  };

  const handleSaveEdit = (updatedAsset) => {
    editAssetMutation.mutate(updatedAsset, {
      onSuccess: () => {
        setShowEditModal(false);
      },
    });
  };

  const handleSaveAlert = async () => {
    if (!selectedAsset || !targetPrice) return;

    const coinId = selectedAsset.coin_id || selectedAsset.coinId;
    const currentPrice = prices[coinId]?.usd || 0;
    const target = parseFloat(targetPrice);

    // Validate alert logic
    if (alertDirection === "above" && currentPrice >= target) {
      Alert.alert(
        t("error"),
        `Cannot set "above" alert. Current price ($${currentPrice.toLocaleString()}) is already above or equal to target ($${target.toLocaleString()}).`,
      );
      return;
    }

    if (alertDirection === "below" && currentPrice <= target) {
      Alert.alert(
        t("error"),
        `Cannot set "below" alert. Current price ($${currentPrice.toLocaleString()}) is already below or equal to target ($${target.toLocaleString()}).`,
      );
      return;
    }

    const stored = await AsyncStorage.getItem("priceAlerts");
    const currentAlerts = stored ? JSON.parse(stored) : [];

    const newAlert = {
      coinId: selectedAsset.coin_id || selectedAsset.coinId,
      coinName: selectedAsset.coin_name || selectedAsset.coinName,
      symbol:
        selectedAsset.symbol ||
        (selectedAsset.coin_name || selectedAsset.coinName)
          .split(" ")[0]
          .toUpperCase(),
      targetPrice: target,
      direction: alertDirection,
      createdAt: Date.now(),
    };

    const updated = [...currentAlerts, newAlert];
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });

    setShowAlertModal(false);
    setSelectedAsset(null);
    setTargetPrice("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      <PortfolioHeader
        user={user}
        userPoints={userPoints}
        alerts={alerts}
        insets={insets}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <PortfolioStats stats={stats} />

        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 15,
            }}
          >
            {t("yourAssets")}
          </Text>

          <AssetList
            portfolio={portfolio}
            isLoading={isLoading}
            prices={prices}
            loadingPrices={loadingPrices}
            onReorder={handleReorder}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onSetAlert={handleSetAlert}
            isReordering={reorderMutation.isPending}
          />
        </View>
      </ScrollView>

      <AddAssetButton onPress={() => setShowAddModal(true)} insets={insets} />

      <AddAssetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAsset}
        isAdding={addAssetMutation.isPending}
        insets={insets}
      />

      <EditAssetModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        asset={selectedAsset}
        insets={insets}
      />

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

              {selectedAsset && (
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
                    {selectedAsset.symbol ||
                      (selectedAsset.coin_name || selectedAsset.coinName)
                        .split(" ")[0]
                        .toUpperCase()}
                  </Text>
                  <Text style={{ color: "#666666", fontSize: 14 }}>
                    {selectedAsset.coin_name || selectedAsset.coinName}
                  </Text>
                  <Text
                    style={{ color: "#999999", fontSize: 12, marginTop: 4 }}
                  >
                    {t("currentPrice")}: $
                    {(
                      prices[selectedAsset.coin_id || selectedAsset.coinId]
                        ?.usd || 0
                    ).toLocaleString()}
                  </Text>
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}
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
                  style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}
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
                onPress={handleSaveAlert}
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
