import { View, Text, ActivityIndicator } from "react-native";
import { TrendingUp, Trophy } from "lucide-react-native";
import { useMyRank } from "@/hooks/useLeaderboard";

export default function MyRankCard() {
  const { data, loading } = useMyRank();

  if (loading) {
    return (
      <View
        style={{
          margin: 16,
          padding: 20,
          backgroundColor: "#FFF4E6",
          borderRadius: 16,
          borderWidth: 2,
          borderColor: "#F7931A",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="small" color="#F7931A" />
      </View>
    );
  }

  if (!data || data.rank === null) {
    return (
      <View
        style={{
          margin: 16,
          padding: 20,
          backgroundColor: "#F3F4F6",
          borderRadius: 16,
          alignItems: "center",
        }}
      >
        <Trophy size={32} color="#9CA3AF" />
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Start earning points to appear on the leaderboard!
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        margin: 16,
        padding: 20,
        backgroundColor: "#FFF4E6",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#F7931A",
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <TrendingUp size={24} color="#F7931A" />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16,
            fontWeight: "bold",
            color: "#000",
          }}
        >
          Your Ranking
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#F7931A" }}>
            #{data.rank}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            Rank
          </Text>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: "#F7931A",
            opacity: 0.3,
          }}
        />

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#000" }}>
            {data.points.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            Points
          </Text>
        </View>
      </View>
    </View>
  );
}
