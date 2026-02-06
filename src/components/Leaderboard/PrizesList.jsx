import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Trophy, Gift, Star } from "lucide-react-native";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function PrizesList() {
  const { data, loading } = useLeaderboard();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 40,
        }}
      >
        <ActivityIndicator size="large" color="#F7931A" />
      </View>
    );
  }

  const prizes = data?.prizes || [];

  const getPrizeIcon = (rank) => {
    if (rank === 1) return <Trophy size={32} color="#FFD700" />;
    if (rank === 2) return <Trophy size={28} color="#C0C0C0" />;
    if (rank === 3) return <Trophy size={24} color="#CD7F32" />;
    return <Gift size={20} color="#6B7280" />;
  };

  const getPrizeColor = (rank) => {
    if (rank === 1) return { bg: "#FEF3C7", border: "#FCD34D" };
    if (rank === 2) return { bg: "#F3F4F6", border: "#D1D5DB" };
    if (rank === 3) return { bg: "#FEE2E2", border: "#FECACA" };
    return { bg: "#F9FAFB", border: "#E5E7EB" };
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          padding: 24,
          alignItems: "center",
          backgroundColor: "#FAFAFA",
        }}
      >
        <Star size={48} color="#F7931A" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 20,
            fontWeight: "bold",
            color: "#000",
          }}
        >
          Competition Prizes
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Climb the leaderboard to win amazing rewards!
        </Text>
      </View>

      {prizes.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Gift size={48} color="#888" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#888",
              textAlign: "center",
            }}
          >
            Prizes will be announced soon!
          </Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          {prizes.map((prize) => {
            const colors = getPrizeColor(prize.rank);
            const isTop3 = prize.rank <= 3;

            return (
              <View
                key={prize.rank}
                style={{
                  marginBottom: 16,
                  padding: 20,
                  backgroundColor: colors.bg,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: colors.border,
                  shadowColor: isTop3 ? "#000" : "transparent",
                  shadowOffset: isTop3
                    ? { width: 0, height: 4 }
                    : { width: 0, height: 0 },
                  shadowOpacity: isTop3 ? 0.1 : 0,
                  shadowRadius: isTop3 ? 8 : 0,
                  elevation: isTop3 ? 4 : 0,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  {getPrizeIcon(prize.rank)}
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#6B7280",
                        marginBottom: 4,
                      }}
                    >
                      RANK #{prize.rank}
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#000",
                      }}
                    >
                      {prize.prizeName}
                    </Text>
                  </View>
                </View>

                {prize.prizeDescription && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#4B5563",
                      lineHeight: 20,
                    }}
                  >
                    {prize.prizeDescription}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Footer */}
      <View style={{ padding: 24, backgroundColor: "#FAFAFA", marginTop: 16 }}>
        <Text
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          Prize winners will be announced at the end of the competition period.
          Keep earning points by completing quests, reading articles, and
          predicting the Magic Coin!
        </Text>
      </View>
    </ScrollView>
  );
}
