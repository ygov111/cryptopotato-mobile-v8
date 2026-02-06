import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Trophy } from "lucide-react-native";
import useUser from "@/utils/auth/useUser";
import { useAuth } from "@/utils/auth/useAuth";
import { apiFetch } from "@/utils/fetchHelper";

const TOP_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
];

export default function MagicCoinCard({ status }) {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const { signUp } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const predictMutation = useMutation({
    mutationFn: async (coin) => {
      const response = await apiFetch("/api/magic-coin/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coinId: coin.id,
          coinName: coin.name,
          coinSymbol: coin.symbol,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save prediction");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["magicCoin"] });
      setShowModal(false);
    },
  });

  const handleSelectCoin = (coin) => {
    if (!user) {
      signUp();
      return;
    }

    if (status?.hasPredicted) return;

    setSelectedCoin(coin);
    predictMutation.mutate(coin);
  };

  const hasWinner = status?.hasWinner;
  const hasPredicted = status?.hasPredicted;
  const won = status?.userPrediction?.won;

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: "#fed319",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              backgroundColor: "#fed319",
              borderRadius: 12,
              padding: 10,
              marginRight: 12,
            }}
          >
            <Sparkles size={24} color="#111111" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#fed319", fontSize: 12, fontWeight: "bold" }}
            >
              DAILY CONTEST
            </Text>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              Magic Coin Challenge
            </Text>
          </View>
          {hasPredicted && (
            <View
              style={{
                backgroundColor: won
                  ? "#10b98120"
                  : hasWinner
                    ? "#ef444420"
                    : "#fed31920",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  color: won ? "#10b981" : hasWinner ? "#ef4444" : "#fed319",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {won ? "🎉 Won!" : hasWinner ? "✗ Lost" : "⏳ Pending"}
              </Text>
            </View>
          )}
        </View>

        <Text style={{ color: "#999999", fontSize: 14, marginBottom: 12 }}>
          Pick the top gainer and win 150 points! 🪙
        </Text>

        {hasPredicted && (
          <View
            style={{
              backgroundColor: "#111111",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#666666", fontSize: 12, marginBottom: 4 }}>
              Your pick:
            </Text>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              {status.userPrediction.predicted_coin_symbol} -{" "}
              {status.userPrediction.predicted_coin_name}
            </Text>
          </View>
        )}

        {hasWinner && (
          <View
            style={{
              backgroundColor: "#111111",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#666666", fontSize: 12, marginBottom: 4 }}>
              Today's winner:
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{ color: "#10b981", fontSize: 16, fontWeight: "bold" }}
              >
                {status.winner.winning_coin_symbol} -{" "}
                {status.winner.winning_coin_name}
              </Text>
              <Text
                style={{ color: "#10b981", fontSize: 14, fontWeight: "bold" }}
              >
                +{Number(status.winner.price_change_24h).toFixed(2)}%
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Trophy size={16} color="#fed319" />
          <Text
            style={{
              color: "#fed319",
              fontSize: 14,
              fontWeight: "bold",
              marginLeft: 6,
            }}
          >
            +150 Potato Points
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
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
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#333333",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                color: "#fed319",
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              DAILY MAGIC COIN CONTEST
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              Pick Tomorrow's Top Gainer
            </Text>

            <Text
              style={{
                color: "#666666",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              {hasPredicted
                ? "You've already made your prediction for today!"
                : "Select the coin you think will have the biggest 24h gain"}
            </Text>

            {hasWinner && (
              <View
                style={{
                  backgroundColor: "#111111",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: "#10b981",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginBottom: 8,
                  }}
                >
                  🏆 Today's Winner
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                  >
                    {status.winner.winning_coin_symbol} -{" "}
                    {status.winner.winning_coin_name}
                  </Text>
                  <Text
                    style={{
                      color: "#10b981",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    +{Number(status.winner.price_change_24h).toFixed(2)}%
                  </Text>
                </View>
              </View>
            )}

            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {TOP_COINS.map((coin) => (
                <Pressable
                  key={coin.id}
                  onPress={() => handleSelectCoin(coin)}
                  disabled={hasPredicted || predictMutation.isPending}
                  style={{
                    backgroundColor:
                      selectedCoin?.id === coin.id ||
                      status?.userPrediction?.predicted_coin_id === coin.id
                        ? "#fed31920"
                        : "#111111",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor:
                      selectedCoin?.id === coin.id ||
                      status?.userPrediction?.predicted_coin_id === coin.id
                        ? "#fed319"
                        : "#333333",
                    opacity:
                      hasPredicted &&
                      status?.userPrediction?.predicted_coin_id !== coin.id
                        ? 0.5
                        : 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {coin.symbol}
                      </Text>
                      <Text style={{ color: "#666666", fontSize: 14 }}>
                        {coin.name}
                      </Text>
                    </View>
                    {(selectedCoin?.id === coin.id ||
                      status?.userPrediction?.predicted_coin_id ===
                        coin.id) && <TrendingUp size={24} color="#fed319" />}
                  </View>
                </Pressable>
              ))}

              {predictMutation.isPending && (
                <ActivityIndicator
                  size="large"
                  color="#fed319"
                  style={{ marginTop: 20 }}
                />
              )}
            </ScrollView>

            <Pressable
              onPress={() => setShowModal(false)}
              style={{
                backgroundColor: "#fed319",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Text
                style={{ color: "#111111", fontSize: 16, fontWeight: "bold" }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
