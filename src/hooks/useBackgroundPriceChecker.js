import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, AppState } from "react-native";

// Background service that checks prices against alerts even when not on Market tab
export function useBackgroundPriceChecker() {
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(Date.now());

  // Load alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["priceAlerts"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem("priceAlerts");
      return stored ? JSON.parse(stored) : [];
    },
    refetchInterval: 10000, // Reload alerts every 10 seconds
  });

  const checkPrices = async () => {
    if (!alerts || alerts.length === 0) {
      console.log("🔔 No alerts to check");
      return;
    }

    const now = Date.now();
    // Only check once per minute to avoid API rate limits
    if (now - lastCheckRef.current < 60000) {
      return;
    }

    lastCheckRef.current = now;

    console.log(`🔔 Background check: Checking ${alerts.length} alerts...`);

    try {
      // Get unique coin IDs from alerts
      const coinIds = [...new Set(alerts.map((a) => a.coinId))].join(",");

      // Fetch prices for all coins with alerts
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
        {
          headers: {
            "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "",
          },
        },
      );

      if (!response.ok) {
        console.error("❌ Failed to fetch prices for alerts");
        return;
      }

      const prices = await response.json();
      console.log(
        "✅ Fetched prices for alerts:",
        Object.keys(prices).length,
        "coins",
      );

      // Check each alert
      const triggeredAlerts = [];
      const remainingAlerts = [];

      for (const alert of alerts) {
        const currentPrice = prices[alert.coinId]?.usd;

        if (!currentPrice) {
          remainingAlerts.push(alert);
          continue;
        }

        const triggered =
          (alert.direction === "above" && currentPrice >= alert.targetPrice) ||
          (alert.direction === "below" && currentPrice <= alert.targetPrice);

        if (triggered) {
          console.log(
            `🔔 Alert triggered: ${alert.symbol} ${alert.direction} $${alert.targetPrice}`,
          );
          triggeredAlerts.push({
            ...alert,
            currentPrice,
          });
        } else {
          remainingAlerts.push(alert);
        }
      }

      // Show alerts and remove triggered ones
      if (triggeredAlerts.length > 0) {
        // Remove triggered alerts from storage
        await AsyncStorage.setItem(
          "priceAlerts",
          JSON.stringify(remainingAlerts),
        );
        queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });

        // Show notification for each triggered alert
        for (const alert of triggeredAlerts) {
          const directionText =
            alert.direction === "above" ? "went above" : "went below";
          Alert.alert(
            `🔔 Price Alert!`,
            `${alert.coinName} (${alert.symbol}) ${directionText} $${alert.targetPrice.toLocaleString()}\n\nCurrent price: $${alert.currentPrice.toLocaleString()}`,
            [{ text: "OK" }],
          );
        }

        console.log(`✅ Triggered ${triggeredAlerts.length} alerts`);
      }
    } catch (error) {
      console.error("❌ Background price check error:", error);
    }
  };

  // Set up background interval
  useEffect(() => {
    console.log("🔔 Background price checker initialized");

    // Check immediately on mount
    checkPrices();

    // Then check every 2 minutes
    intervalRef.current = setInterval(checkPrices, 120000); // 2 minutes

    // Monitor app state changes
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("🔔 App came to foreground, checking prices...");
        checkPrices();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
      console.log("🔔 Background price checker stopped");
    };
  }, [alerts]);

  return { checkPrices };
}
