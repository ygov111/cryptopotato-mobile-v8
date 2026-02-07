import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check } from "lucide-react-native";
import { LANGUAGES } from "@/utils/i18n";

export default function LanguageSelector({
  visible,
  onClose,
  onSelect,
  currentLang = "en",
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#1a1a1a",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            maxHeight: "70%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
              Select Language
            </Text>
            <Pressable onPress={onClose}>
              <X size={28} color="#999999" />
            </Pressable>
          </View>

          {/* Language List */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((language) => (
              <Pressable
                key={language.code}
                onPress={() => {
                  onSelect(language.code);
                  onClose();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  backgroundColor:
                    currentLang === language.code ? "#2a2a2a" : "#111111",
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: currentLang === language.code ? 1 : 0,
                  borderColor: "#fed319",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Text style={{ fontSize: 32, marginRight: 12 }}>
                    {language.flag}
                  </Text>
                  <View>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {language.nativeName}
                    </Text>
                    <Text style={{ color: "#999999", fontSize: 14 }}>
                      {language.name}
                    </Text>
                  </View>
                </View>

                {currentLang === language.code && (
                  <Check size={20} color="#fed319" strokeWidth={3} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export { LANGUAGES };



