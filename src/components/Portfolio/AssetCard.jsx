import { View, Text, Pressable } from "react-native";
import {
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Trash2,
  Bell,
  Edit2,
} from "lucide-react-native";
import { getUIText } from "@/utils/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

export function AssetCard({
  asset,
  index,
  portfolioLength,
  currentPrice,
  loadingPrices,
  onReorder,
  onDelete,
  onEdit,
  onSetAlert,
  isReordering,
}) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem("userLanguage");
        if (saved) setLanguage(saved);
      } catch (error) {
        console.error("Failed to load language:", error);
      }
    };
    loadLang();
  }, []);

  const t = (key) => getUIText(key, language);

  const coinId = asset.coin_id || asset.coinId;
  const buyPrice = asset.buy_price || asset.buyPrice;
  const amount = asset.amount;
  const symbol =
    asset.symbol ||
    (asset.coin_name || asset.coinName).split(" ")[0].toUpperCase();

  const isTrackingOnly = !amount || !buyPrice;

  let currentValue = 0;
  let invested = 0;
  let pl = 0;
  let plPercent = 0;

  if (!isTrackingOnly) {
    currentValue = currentPrice * amount;
    invested = buyPrice * amount;
    pl = currentValue - invested;
    plPercent = invested > 0 ? (pl / invested) * 100 : 0;
  }

  const coinName = asset.coin_name || asset.coinName || "";

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

  return (
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
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                marginRight: 8,
              }}
            >
              {symbol}
            </Text>
            <Text style={{ color: "#666666", fontSize: 14 }}>{coinName}</Text>
          </View>
          <Text style={{ color: "#666666", fontSize: 12 }}>
            {isTrackingOnly
              ? t("trackingOnly")
              : `${amount} @ $${buyPrice.toLocaleString()}`}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            ${loadingPrices ? "..." : formatPrice(currentPrice)}
          </Text>
          {!isTrackingOnly && (
            <Text
              style={{
                color: "#666666",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Value: $
              {currentValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          )}
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          }}
        >
          {!isTrackingOnly && (
            <>
              {pl >= 0 ? (
                <TrendingUp size={14} color="#10b981" />
              ) : (
                <TrendingDown size={14} color="#ef4444" />
              )}
              <Text
                style={{
                  color: pl >= 0 ? "#10b981" : "#ef4444",
                  fontSize: 14,
                  marginLeft: 4,
                }}
              >
                $
                {Math.abs(pl).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ({plPercent >= 0 ? "+" : ""}
                {plPercent.toFixed(2)}%)
              </Text>
            </>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => onEdit(asset)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: "#2a2a2a",
            }}
          >
            <Edit2 size={16} color="#fed319" />
          </Pressable>

          <Pressable
            onPress={() => onSetAlert(asset)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: "#2a2a2a",
            }}
          >
            <Bell size={16} color="#fed319" />
          </Pressable>

          <Pressable
            onPress={() => onReorder(asset.id, "up")}
            disabled={index === 0 || isReordering}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: index === 0 ? "#1a1a1a" : "#2a2a2a",
            }}
          >
            <ChevronUp size={16} color={index === 0 ? "#444444" : "#fed319"} />
          </Pressable>

          <Pressable
            onPress={() => onReorder(asset.id, "down")}
            disabled={index === portfolioLength - 1 || isReordering}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor:
                index === portfolioLength - 1 ? "#1a1a1a" : "#2a2a2a",
            }}
          >
            <ChevronDown
              size={16}
              color={index === portfolioLength - 1 ? "#444444" : "#fed319"}
            />
          </Pressable>

          <Pressable
            onPress={() => onDelete(asset.id)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: "#2a1a1a",
            }}
          >
            <Trash2 size={16} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
