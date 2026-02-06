import { View, Text } from "react-native";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUIText, DEFAULT_LANGUAGE } from "@/utils/i18n";

export function PortfolioStats({ stats }) {
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
        margin: 20,
        backgroundColor: "#1a1a1a",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <Text style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}>
        {t("totalValue")}
      </Text>
      <Text
        style={{
          color: "white",
          fontSize: 36,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        $
        {stats.totalValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "#999999", fontSize: 12, marginBottom: 4 }}>
            {t("profitLoss")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {stats.profitLoss >= 0 ? (
              <TrendingUp size={16} color="#10b981" />
            ) : (
              <TrendingDown size={16} color="#ef4444" />
            )}
            <Text
              style={{
                color: stats.profitLoss >= 0 ? "#10b981" : "#ef4444",
                fontSize: 16,
                fontWeight: "bold",
                marginLeft: 4,
              }}
            >
              $
              {Math.abs(stats.profitLoss).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        <View>
          <Text style={{ color: "#999999", fontSize: 12, marginBottom: 4 }}>
            {t("returnPercent")}
          </Text>
          <Text
            style={{
              color: stats.profitLoss >= 0 ? "#10b981" : "#ef4444",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {stats.profitLossPercent >= 0 ? "+" : ""}
            {stats.profitLossPercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
}
