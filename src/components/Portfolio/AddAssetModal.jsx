import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X, Search } from "lucide-react-native";
import { TOP_COINS } from "@/utils/coinList";

export function AddAssetModal({ visible, onClose, onAdd, isAdding, insets }) {
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const topCoins = TOP_COINS;

  const filteredCoins = topCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdd = () => {
    if (!selectedCoin) return;
    onAdd({
      coin_name: selectedCoin.name,
      coin_id: selectedCoin.id,
      symbol: selectedCoin.symbol,
      amount: amount ? parseFloat(amount) : null,
      buy_price: buyPrice ? parseFloat(buyPrice) : null,
    });
    setSelectedCoin(null);
    setAmount("");
    setBuyPrice("");
    setSearchQuery("");
  };

  const handleClose = () => {
    setSelectedCoin(null);
    setAmount("");
    setBuyPrice("");
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
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
            maxHeight: "80%",
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
              Add Asset
            </Text>
            <Pressable onPress={handleClose}>
              <X size={28} color="#999999" />
            </Pressable>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}>
              Search Coin
            </Text>
            <View style={{ position: "relative" }}>
              <Search
                size={20}
                color="#666666"
                style={{ position: "absolute", left: 16, top: 16, zIndex: 1 }}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or ticker..."
                placeholderTextColor="#666666"
                style={{
                  backgroundColor: "#111111",
                  color: "white",
                  padding: 16,
                  paddingLeft: 48,
                  borderRadius: 12,
                  fontSize: 16,
                }}
              />
            </View>
          </View>

          {searchQuery && (
            <ScrollView
              style={{
                backgroundColor: "#111111",
                borderRadius: 12,
                marginBottom: 16,
                maxHeight: 200,
              }}
            >
              {filteredCoins.map((coin) => (
                <Pressable
                  key={coin.id}
                  onPress={() => {
                    setSelectedCoin(coin);
                    setSearchQuery("");
                  }}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderColor: "#1a1a1a",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {coin.symbol.toUpperCase()}
                      </Text>
                      <Text style={{ color: "#666666", fontSize: 12 }}>
                        {coin.name}
                      </Text>
                    </View>
                    <Text style={{ color: "#999999", fontSize: 14 }}>
                      ${coin.current_price?.toLocaleString()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {selectedCoin && (
            <View
              style={{
                backgroundColor: "#111111",
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  {selectedCoin.symbol.toUpperCase()}
                </Text>
                <Text style={{ color: "#666666", fontSize: 14 }}>
                  {selectedCoin.name}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedCoin(null)}>
                <X size={20} color="#666666" />
              </Pressable>
            </View>
          )}

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}>
              Amount (optional)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Leave empty to track without amount"
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
            <Text style={{ color: "#999999", fontSize: 14, marginBottom: 8 }}>
              Buy Price (USD) (optional)
            </Text>
            <TextInput
              value={buyPrice}
              onChangeText={setBuyPrice}
              placeholder="Leave empty to track without buy price"
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
            onPress={handleAdd}
            disabled={isAdding || !selectedCoin}
            style={{
              backgroundColor: selectedCoin ? "#fed319" : "#333333",
              padding: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {isAdding ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text
                style={{
                  color: selectedCoin ? "#111111" : "#666666",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Add to Portfolio
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
