import { View, Text, ActivityIndicator } from "react-native";
import { AssetCard } from "./AssetCard";

export function AssetList({
  portfolio,
  isLoading,
  prices,
  loadingPrices,
  onReorder,
  onDelete,
  onEdit,
  onSetAlert,
  isReordering,
}) {
  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color="#fed319"
        style={{ marginTop: 40 }}
      />
    );
  }

  if (portfolio.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 60 }}>
        <Text style={{ color: "#666666", fontSize: 16, textAlign: "center" }}>
          No assets yet.{"\n"}Start building your portfolio!
        </Text>
      </View>
    );
  }

  return (
    <>
      {portfolio.map((asset, index) => {
        const coinId = asset.coin_id || asset.coinId;
        const currentPrice = prices[coinId]?.usd || 0;

        return (
          <AssetCard
            key={asset.id || index}
            asset={asset}
            index={index}
            portfolioLength={portfolio.length}
            currentPrice={currentPrice}
            loadingPrices={loadingPrices}
            onReorder={onReorder}
            onDelete={onDelete}
            onEdit={onEdit}
            onSetAlert={onSetAlert}
            isReordering={isReordering}
          />
        );
      })}
    </>
  );
}
