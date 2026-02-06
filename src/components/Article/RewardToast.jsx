import { View, Text } from "react-native";

export function RewardToast({ insets, rewardInfo }) {
  if (!rewardInfo) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + 60,
        left: 20,
        right: 20,
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: rewardInfo.gotBonus ? "#4ade80" : "#fed319",
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>
          {rewardInfo.gotBonus ? "🎉" : "🥔"}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fed319", fontSize: 13, fontWeight: "bold" }}>
            +{rewardInfo.points} Points
          </Text>
          {rewardInfo.gotBonus && (
            <Text style={{ color: "#4ade80", fontSize: 11, marginTop: 2 }}>
              +5 Bonus! 🌟
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
