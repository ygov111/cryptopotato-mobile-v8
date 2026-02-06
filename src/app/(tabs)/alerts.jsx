import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Trash2, Edit2, Plus, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUser from "@/utils/auth/useUser";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { coinId: filterCoinId } = useLocalSearchParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
  const [currentPrice, setCurrentPrice] = useState(null);
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

  // Load price alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts", user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
  });

  // Fetch current price when modal opens
  useEffect(() => {
    if (selectedAlert && selectedAlert.coinId) {
      fetchCurrentPrice(selectedAlert.coinId);
    }
  }, [selectedAlert]);

  const fetchCurrentPrice = async (coinId) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: {
            "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "",
          },
        },
      );
      const data = await response.json();
      setCurrentPrice(data[coinId]?.usd || null);
    } catch (error) {
      console.error("Failed to fetch current price:", error);
      setCurrentPrice(null);
    }
  };

  const handleEdit = (alert) => {
    setSelectedAlert(alert);
    setTargetPrice(alert.targetPrice.toString());
    setAlertDirection(alert.direction);
    setShowEditModal(true);
  };

  const handleDelete = async (alert) => {
    Alert.alert(
      t("deleteAlert"),
      "Are you sure you want to delete this alert?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            const updated = alerts.filter(
              (a) => a.createdAt !== alert.createdAt,
            );
            await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
            queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
          },
        },
      ],
    );
  };

  const handleSaveEdit = async () => {
    if (!selectedAlert || !targetPrice) return;

    const target = parseFloat(targetPrice);

    // Validate alert logic if we have current price
    if (currentPrice) {
      if (alertDirection === "above" && currentPrice >= target) {
        setShowEditModal(false);
        setTimeout(() => {
          Alert.alert(
            t("error"),
            `Cannot set "above" alert. Current price ($${currentPrice.toLocaleString()}) is already above or equal to target ($${target.toLocaleString()}).`,
          );
        }, 300);
        return;
      }

      if (alertDirection === "below" && currentPrice <= target) {
        setShowEditModal(false);
        setTimeout(() => {
          Alert.alert(
            t("error"),
            `Cannot set "below" alert. Current price ($${currentPrice.toLocaleString()}) is already below or equal to target ($${target.toLocaleString()}).`,
          );
        }, 300);
        return;
      }
    }

    const updated = alerts.map((alert) =>
      alert.coinId === selectedAlert.coinId &&
      alert.createdAt === selectedAlert.createdAt
        ? {
            ...alert,
            targetPrice: target,
            direction: alertDirection,
          }
        : alert,
    );

    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    setShowEditModal(false);
    setSelectedAlert(null);
    setTargetPrice("");
    setCurrentPrice(null);
  };

  const handleAddNewAlert = (alert) => {
    setSelectedAlert({ ...alert, isNew: true });
    setTargetPrice("");
    setAlertDirection("above");
    setShowEditModal(true);
  };

  const handleSaveNewAlert = async () => {
    if (!selectedAlert || !targetPrice) return;

    const target = parseFloat(targetPrice);

    // Validate alert logic if we have current price
    if (currentPrice) {
      if (alertDirection === "above" && currentPrice >= target) {
        setShowEditModal(false);
        setTimeout(() => {
          Alert.alert(
            "Invalid Alert",
            `Cannot set "above" alert. Current price ($${currentPrice.toLocaleString()}) is already above or equal to target ($${target.toLocaleString()}).`,
          );
        }, 300);
        return;
      }

      if (alertDirection === "below" && currentPrice <= target) {
        setShowEditModal(false);
        setTimeout(() => {
          Alert.alert(
            "Invalid Alert",
            `Cannot set "below" alert. Current price ($${currentPrice.toLocaleString()}) is already below or equal to target ($${target.toLocaleString()}).`,
          );
        }, 300);
        return;
      }
    }

    const newAlert = {
      coinId: selectedAlert.coinId,
      coinName: selectedAlert.coinName,
      symbol: selectedAlert.symbol,
      targetPrice: target,
      direction: alertDirection,
      createdAt: Date.now(),
    };

    const updated = [...alerts, newAlert];
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    setShowEditModal(false);
    setSelectedAlert(null);
    setTargetPrice("");
    setCurrentPrice(null);
  };

  // Group alerts by coin
  const alertsByCoin = {};
  alerts.forEach((alert) => {
    if (!alertsByCoin[alert.coinId]) {
      alertsByCoin[alert.coinId] = [];
    }
    alertsByCoin[alert.coinId].push(alert);
  });

  // Filter alerts if coinId is provided
  const filteredAlertsByCoin = filterCoinId
    ? Object.entries(alertsByCoin).filter(([coinId]) => coinId === filterCoinId)
    : Object.entries(alertsByCoin);

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 15,
          paddingBottom: 12,
          backgroundColor: "#111111",
          borderBottomWidth: 1,
          borderColor: "#222222",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#1a1a1a",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color="#fed319" />
          </Pressable>

          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              flex: 1,
            }}
          >
            {filterCoinId
              ? "Coin Alerts"
              : `${t("priceAlerts")} (${alerts.length})`}
          </Text>
        </View>

        {filterCoinId && (
          <Pressable
            onPress={() => router.setParams({ coinId: undefined })}
            style={{
              backgroundColor: "#1a1a1a",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fed319", fontSize: 14 }}>
              {t("showAll")}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Alerts List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text
              style={{
                color: "#666666",
                fontSize: 16,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {t("alertsNone")}
            </Text>
          </View>
        ) : filteredAlertsByCoin.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text
              style={{
                color: "#666666",
                fontSize: 16,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {t("noAlertsForCoin")}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            {filteredAlertsByCoin.map(([coinId, coinAlerts]) => {
              const firstAlert = coinAlerts[0];
              return (
                <View
                  key={coinId}
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  {/* Coin Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderColor: "#333333",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                      >
                        {firstAlert.symbol}
                      </Text>
                      <Text style={{ color: "#666666", fontSize: 14 }}>
                        {firstAlert.coinName}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleAddNewAlert(firstAlert)}
                      style={{
                        backgroundColor: "#fed319",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={16} color="#111111" />
                      <Text
                        style={{
                          color: "#111111",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {t("addAlert")}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Alerts for this coin */}
                  {coinAlerts.map((alert, index) => (
                    <View
                      key={alert.createdAt || index}
                      style={{
                        backgroundColor: "#111111",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: index < coinAlerts.length - 1 ? 8 : 0,
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
                              fontSize: 16,
                              fontWeight: "bold",
                            }}
                          >
                            ${alert.targetPrice.toLocaleString()}
                          </Text>
                          <Text
                            style={{
                              color: "#999999",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {alert.direction === "above"
                              ? t("notifyWhenGoesAbove")
                              : t("notifyWhenGoesBelow")}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Pressable
                            onPress={() => handleEdit(alert)}
                            style={{
                              backgroundColor: "#2a2a2a",
                              padding: 8,
                              borderRadius: 8,
                            }}
                          >
                            <Edit2 size={16} color="#fed319" />
                          </Pressable>

                          <Pressable
                            onPress={() => handleDelete(alert)}
                            style={{
                              backgroundColor: "#2a1a1a",
                              padding: 8,
                              borderRadius: 8,
                            }}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Edit/Add Alert Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
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
                {selectedAlert?.isNew ? t("addNewAlert") : t("editAlert")}
              </Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <X size={28} color="#999999" />
              </Pressable>
            </View>

            {selectedAlert && (
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
                  {selectedAlert.symbol}
                </Text>
                <Text style={{ color: "#666666", fontSize: 14 }}>
                  {selectedAlert.coinName}
                </Text>
                {currentPrice && (
                  <Text
                    style={{ color: "#999999", fontSize: 12, marginTop: 4 }}
                  >
                    {t("currentPrice")}: ${currentPrice.toLocaleString()}
                  </Text>
                )}
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}>
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
                      color: alertDirection === "above" ? "#111111" : "#999999",
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
                      color: alertDirection === "below" ? "#111111" : "#999999",
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
              <Text style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}>
                {t("targetPrice")}
              </Text>
              <TextInput
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder={t("targetPrice") + "..."}
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
              onPress={
                selectedAlert?.isNew ? handleSaveNewAlert : handleSaveEdit
              }
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
                {selectedAlert?.isNew ? t("addAlert") : t("saveChanges")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
