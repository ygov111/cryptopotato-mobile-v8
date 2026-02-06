import { View, Text, Pressable } from "react-native";

export function LanguageBadge({ currentLang, onShowOriginal }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        flexWrap: "wrap",
      }}
    >
      <View
        style={{
          backgroundColor: "#fed319",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 6 }}>{currentLang.flag}</Text>
        <Text style={{ color: "#111111", fontSize: 12, fontWeight: "bold" }}>
          {currentLang.nativeName}
        </Text>
      </View>
      <Pressable onPress={onShowOriginal} style={{ marginLeft: 12 }}>
        <Text
          style={{
            color: "#fed319",
            fontSize: 14,
            textDecorationLine: "underline",
          }}
        >
          Show Original
        </Text>
      </Pressable>
    </View>
  );
}
