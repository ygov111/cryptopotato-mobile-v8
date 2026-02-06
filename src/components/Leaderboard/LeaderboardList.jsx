import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Trophy, Crown, Medal, AlertCircle } from "lucide-react-native";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import useUser from "@/utils/auth/useUser";

export default function LeaderboardList() {
  const { data, loading: loadingLeaderboard, error } = useLeaderboard();
  const { data: currentUser } = useUser();

  console.log("🏆 LeaderboardList render:", {
    loading: loadingLeaderboard,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    leaderboardCount: data?.leaderboard?.length || 0,
    error: error?.message,
  });

  if (loadingLeaderboard) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 40,
        }}
      >
        <ActivityIndicator size="large" color="#fed319" />
        <Text style={{ color: "#999999", fontSize: 14, marginTop: 12 }}>
          Loading leaderboard...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    console.error("❌ Leaderboard error:", error);
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <AlertCircle size={48} color="#ef4444" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: "#ef4444",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Failed to load leaderboard
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#999999",
            textAlign: "center",
          }}
        >
          {error.message || "Please try again later"}
        </Text>
      </View>
    );
  }

  const leaderboard = data?.leaderboard || [];

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={24} color="#FFD700" />;
    if (rank === 2) return <Medal size={24} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={24} color="#CD7F32" />;
    return <Trophy size={20} color="#888" />;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#111111" }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {leaderboard.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Trophy size={48} color="#fed319" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#fed319",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            No rankings yet
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#999999",
              textAlign: "center",
            }}
          >
            Be the first to earn points!
          </Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          {leaderboard.map((user, index) => {
            const isCurrentUser = currentUser && user.userId === currentUser.id;
            const isTop3 = user.rank <= 3;

            return (
              <View
                key={user.userId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: isCurrentUser
                    ? "#fed31920"
                    : isTop3
                      ? "#1a1a1a"
                      : "#151515",
                  borderRadius: 12,
                  borderWidth: isCurrentUser ? 2 : 1,
                  borderColor: isCurrentUser ? "#fed319" : "#222222",
                }}
              >
                {/* Rank Icon */}
                <View style={{ width: 40, alignItems: "center" }}>
                  {getRankIcon(user.rank)}
                </View>

                {/* Rank Number */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: isTop3 ? "#fed319" : "#666666",
                    width: 40,
                  }}
                >
                  #{user.rank}
                </Text>

                {/* User Name */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: isCurrentUser ? "bold" : "600",
                      color: "#ffffff",
                    }}
                    numberOfLines={1}
                  >
                    {user.name}
                    {isCurrentUser && (
                      <Text style={{ color: "#fed319", fontWeight: "bold" }}>
                        {" "}
                        (You)
                      </Text>
                    )}
                  </Text>
                </View>

                {/* Points */}
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: isTop3 ? "#fed31920" : "#1a1a1a",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isTop3 ? "#fed319" : "#222222",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: isTop3 ? "#fed319" : "#999999",
                    }}
                  >
                    {user.points.toLocaleString()} pts
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
