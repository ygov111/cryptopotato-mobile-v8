import { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { X } from "lucide-react-native";

export function EditAssetModal({ visible, onClose, onSave, asset, insets }) {
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  useEffect(() => {
    if (asset) {
      setAmount(asset.amount?.toString() || "");
      setBuyPrice(
        asset.buy_price?.toString() || asset.buyPrice?.toString() || "",
      );
    }
  }, [asset]);

  const handleSave = () => {
    const amountNum = parseFloat(amount);
    const buyPriceNum = parseFloat(buyPrice);

    if (
      isNaN(amountNum) ||
      isNaN(buyPriceNum) ||
      amountNum <= 0 ||
      buyPriceNum <= 0
    ) {
      return;
    }

    onSave({
      id: asset.id,
      amount: amountNum,
      buy_price: buyPriceNum,
    });
  };

  const canSave =
    amount && buyPrice && parseFloat(amount) > 0 && parseFloat(buyPrice) > 0;

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
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
              Edit Asset
            </Text>
            <Pressable onPress={onClose}>
              <X size={28} color="#999999" />
            </Pressable>
          </View>

          {asset && (
            <>
              <View
                style={{
                  backgroundColor: "#111111",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  {asset.symbol ||
                    (asset.coin_name || asset.coinName)
                      .split(" ")[0]
                      .toUpperCase()}
                </Text>
                <Text style={{ color: "#666666", fontSize: 14 }}>
                  {asset.coin_name || asset.coinName}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}
                >
                  Amount
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: "#111111",
                    color: "white",
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}
                >
                  Buy Price (USD)
                </Text>
                <TextInput
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: "#111111",
                    color: "white",
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 16,
                  }}
                />
              </View>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={{
                  backgroundColor: canSave ? "#fed319" : "#333333",
                  padding: 18,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: canSave ? "#111111" : "#666666",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Save Changes
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
