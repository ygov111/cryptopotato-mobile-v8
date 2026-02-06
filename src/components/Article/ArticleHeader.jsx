import { View, Text, Pressable } from "react-native";
import { ArrowLeft, Share2, Languages, BookOpen } from "lucide-react-native";

export function ArticleHeader({
  insets,
  onBack,
  t,
  progress,
  userPoints,
  onPointsPress,
  selectedLang,
  onTranslatePress,
  onSharePress,
}) {
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 15,
        paddingBottom: 12,
        backgroundColor: "#111111",
        borderBottomWidth: 1,
        borderColor: "#222222",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <Pressable
          onPress={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#1a1a1a",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <ArrowLeft size={20} color="#fed319" />
        </Pressable>

        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "600",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {t("article")}
        </Text>
      </View>

      {/* Points, Reading Progress and Share Button */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {/* Daily Reading Progress */}
        <Pressable
          style={{
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#1a1a1a",
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: progress.completed ? "#4ade80" : "#fed319",
            minWidth: 50,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <BookOpen
              size={12}
              color={progress.completed ? "#4ade80" : "#fed319"}
            />
            <Text
              style={{
                color: progress.completed ? "#4ade80" : "#fed319",
                fontSize: 11,
                fontWeight: "bold",
                marginLeft: 3,
              }}
            >
              {progress.articlesRead}/3
            </Text>
          </View>
          {/* Progress bar */}
          <View
            style={{
              width: 40,
              height: 3,
              backgroundColor: "#333333",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${(progress.articlesRead / 3) * 100}%`,
                height: "100%",
                backgroundColor: progress.completed ? "#4ade80" : "#fed319",
              }}
            />
          </View>
        </Pressable>

        {/* Potato Points */}
        <Pressable
          onPress={onPointsPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1a1a1a",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#fed319",
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 4 }}>🥔</Text>
          <Text style={{ color: "#fed319", fontSize: 14, fontWeight: "bold" }}>
            {userPoints || 0}
          </Text>
        </Pressable>

        {/* Translate Button */}
        <Pressable
          onPress={onTranslatePress}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: selectedLang !== "en" ? "#fed319" : "#1a1a1a",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Languages
            size={18}
            color={selectedLang !== "en" ? "#111111" : "#fed319"}
          />
        </Pressable>

        {/* Share Button */}
        <Pressable
          onPress={onSharePress}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#1a1a1a",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Share2 size={18} color="#fed319" />
        </Pressable>
      </View>
    </View>
  );
}
