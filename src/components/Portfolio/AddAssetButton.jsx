import { Pressable } from "react-native";
import { Plus } from "lucide-react-native";

export function AddAssetButton({ onPress, insets }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        bottom: insets.bottom + 20,
        right: 20,
        backgroundColor: "#fed319",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#fed319",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}
    >
      <Plus size={30} color="#111111" strokeWidth={3} />
    </Pressable>
  );
}
