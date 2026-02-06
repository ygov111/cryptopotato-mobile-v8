import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export function usePriceAlerts(user) {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts", user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const saveAlert = async (alertCoin, targetPrice, alertDirection) => {
    if (!alertCoin || !targetPrice) return;

    const newAlert = {
      coinId: alertCoin.coinId,
      coinName: alertCoin.coinName,
      symbol: alertCoin.symbol,
      targetPrice: parseFloat(targetPrice),
      direction: alertDirection,
      createdAt: Date.now(),
    };

    const updated = [...alerts, newAlert];
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });

    Alert.alert(
      "Alert Set",
      `You'll be notified when ${alertCoin.symbol} ${alertDirection === "above" ? "goes above" : "goes below"} $${targetPrice}`,
    );
  };

  const removeAlert = async (coinId) => {
    const updated = alerts.filter((a) => a.coinId !== coinId);
    await AsyncStorage.setItem("priceAlerts", JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
  };

  return { alerts, saveAlert, removeAlert };
}
