import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";

export function ContentRenderer({ contentBlocks, onImagePress, onLinkPress }) {
  const router = useRouter();

  const renderInlineParts = (parts, fontSize = 16, color = "#cccccc") => {
    return parts.map((part, index) => {
      if (part.type === "text") {
        return (
          <Text
            key={index}
            style={{ color, fontSize, lineHeight: fontSize + 10 }}
          >
            {part.content}
          </Text>
        );
      } else if (part.type === "link") {
        return (
          <Text
            key={index}
            onPress={() => onLinkPress(part.url)}
            style={{
              color: "#fed319",
              fontSize,
              lineHeight: fontSize + 10,
              textDecorationLine: "underline",
            }}
          >
            {part.text}
          </Text>
        );
      }
      return null;
    });
  };

  return contentBlocks.map((block, index) => {
    if (block.type === "image") {
      return (
        <Pressable
          key={index}
          onPress={() => onImagePress(block.url)}
          style={{ marginBottom: 15 }}
        >
          <Image
            source={{ uri: block.url }}
            style={{ width: "100%", height: 200, borderRadius: 8 }}
            resizeMode="cover"
          />
        </Pressable>
      );
    } else if (block.type === "tweet") {
      return (
        <View
          key={index}
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: "#1DA1F2",
            padding: 16,
            marginBottom: 16,
          }}
        >
          {/* Tweet Text */}
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            {block.text}
          </Text>

          {/* Author */}
          {block.author && (
            <Text
              style={{
                color: "#888888",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              @{block.author}
            </Text>
          )}

          {/* View on X Button */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/webview",
                params: { url: encodeURIComponent(block.url) },
              })
            }
            style={{
              backgroundColor: "#1DA1F2",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              View on X
            </Text>
          </Pressable>
        </View>
      );
    } else if (block.type === "heading") {
      // Much larger heading sizes - h1=32, h2=28, h3=24, h4=20, h5=18, h6=17
      let fontSize;
      if (block.level === 1) fontSize = 32;
      else if (block.level === 2) fontSize = 28;
      else if (block.level === 3) fontSize = 24;
      else if (block.level === 4) fontSize = 20;
      else if (block.level === 5) fontSize = 18;
      else fontSize = 17;

      const fontWeight = block.level <= 3 ? "bold" : "600";
      return (
        <View key={index} style={{ marginTop: 24, marginBottom: 12 }}>
          <Text
            style={{
              color: "white",
              fontSize,
              fontWeight,
              lineHeight: fontSize + 8,
            }}
          >
            {renderInlineParts(block.parts, fontSize, "white")}
          </Text>
        </View>
      );
    } else if (block.type === "paragraph") {
      return (
        <View key={index} style={{ marginBottom: 12 }}>
          <Text style={{ color: "#cccccc", fontSize: 16, lineHeight: 26 }}>
            {renderInlineParts(block.parts)}
          </Text>
        </View>
      );
    }
    return null;
  });
}
