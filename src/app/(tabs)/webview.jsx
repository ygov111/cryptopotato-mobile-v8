import { View, Pressable, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { WebView } from "react-native-webview";

export default function WebViewScreen() {
  const { url } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Decode URL
  let decodedUrl = "";
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    decodedUrl = url || "";
  }

  console.log("WebViewScreen - URL:", decodedUrl);

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* Header */}
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
        }}
      >
        <Pressable
          onPress={() => router.back()}
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
          Browser
        </Text>
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: decodedUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#111111",
            }}
          >
            <ActivityIndicator size="large" color="#fed319" />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error:", nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView HTTP error:", nativeEvent.statusCode);
        }}
      />
    </View>
  );
}
