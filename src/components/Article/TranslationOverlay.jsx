import { View, Text, ActivityIndicator } from "react-native";

export function TranslationOverlay({ isTranslating, currentLang }) {
  if (!isTranslating) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: "#1a1a1a",
          padding: 24,
          borderRadius: 16,
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fed319" />
        <Text style={{ color: "white", fontSize: 16, marginTop: 12 }}>
          Translating...
        </Text>
        <Text style={{ color: "#999999", fontSize: 14, marginTop: 4 }}>
          {currentLang.nativeName}
        </Text>
      </View>
    </View>
  );
}
