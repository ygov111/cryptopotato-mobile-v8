import { Modal, View, Pressable, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WebViewModal({ visible, url, onClose }) {
  const insets = useSafeAreaInsets();

  console.log("WebViewModal render - visible:", visible, "url:", url);

  if (!url) {
    console.log("WebViewModal: No URL provided, returning null");
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#111111" }}>
        {/* Header with Close Button */}
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
          <Pressable
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#1a1a1a",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <X size={20} color="#fed319" />
          </Pressable>
        </View>

        {/* WebView */}
        <WebView
          source={{ uri: url }}
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
    </Modal>
  );
}
