import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  Newspaper,
  Lock,
  Trophy,
  Globe,
  Check,
  TrendingUp,
} from "lucide-react-native";
import { LANGUAGES, setRTL } from "@/utils/i18n";

const { width } = Dimensions.get("window");

// Top coins to choose from
const AVAILABLE_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedCoins, setSelectedCoins] = useState([
    "bitcoin",
    "ethereum",
    "solana",
  ]);
  const scrollViewRef = useRef(null);
  const router = useRouter();

  const slides = [
    {
      type: "language",
      icon: Globe,
      title: "Welcome to CryptoNews",
      description: "Choose your preferred language to get started",
    },
    {
      icon: Newspaper,
      title: "Expert Crypto News",
      description:
        "Stay ahead with curated news from CryptoPotato expert journalists. Real-time updates on Bitcoin, Ethereum, and the entire crypto market.",
    },
    {
      icon: Lock,
      title: "Private Local Portfolio",
      description:
        "Track your crypto holdings privately. Your portfolio data stays on your device—no cloud sync required unless you choose to sign in.",
    },
    {
      icon: Trophy,
      title: "Earn Potato Points",
      description:
        "Claim daily rewards and build your Spud stash. The more you engage, the more you earn. Your points, your crypto journey.",
    },
    {
      type: "coins",
      icon: TrendingUp,
      title: "Track Your Coins",
      description: "Select at least 3 coins to track for personalized news",
    },
  ];

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleLanguageSelect = async (langCode) => {
    try {
      const lang = LANGUAGES.find((l) => l.code === langCode);
      if (!lang) return;

      setSelectedLanguage(langCode);
      await AsyncStorage.setItem("userLanguage", langCode);
      setRTL(lang.rtl);

      // Auto-advance to next slide after selection
      setTimeout(() => {
        goToNext();
      }, 300);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const toggleCoin = (coinId) => {
    setSelectedCoins((prev) => {
      if (prev.includes(coinId)) {
        return prev.filter((id) => id !== coinId);
      } else {
        return [...prev, coinId];
      }
    });
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: width * nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleGetStarted = async () => {
    try {
      if (selectedCoins.length < 3) {
        Alert.alert("Select Coins", "Please select at least 3 coins to track");
        return;
      }

      // Save tracked coins
      await AsyncStorage.setItem("trackedCoins", JSON.stringify(selectedCoins));

      // Add selected coins to portfolio
      const portfolioAssets = selectedCoins.map((coinId, index) => {
        const coin = AVAILABLE_COINS.find((c) => c.id === coinId);
        return {
          id: Date.now() + index,
          coin_name: coin.name,
          coinId: coin.id,
          symbol: coin.symbol,
          amount: null,
          buyPrice: null,
          display_order: index,
        };
      });

      await AsyncStorage.setItem("portfolio", JSON.stringify(portfolioAssets));

      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/(tabs)/news");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  };

  const handleSkip = async () => {
    // Save default language if not selected
    if (!selectedLanguage) {
      await AsyncStorage.setItem("userLanguage", "en");
    }
    // Save default coins
    await AsyncStorage.setItem(
      "trackedCoins",
      JSON.stringify(["bitcoin", "ethereum", "solana"]),
    );
    await handleGetStarted();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {currentIndex < slides.length - 1 && currentIndex > 0 && (
        <Pressable
          onPress={handleSkip}
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            zIndex: 10,
            padding: 10,
          }}
        >
          <Text style={{ color: "#fed319", fontSize: 16, fontWeight: "600" }}>
            Skip
          </Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={currentIndex !== 0} // Disable scroll on language selection
      >
        {slides.map((slide, index) => {
          if (slide.type === "language") {
            // Language Selection Slide
            return (
              <View
                key={index}
                style={{
                  width,
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 30,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fed319",
                    borderRadius: 100,
                    padding: 30,
                    marginBottom: 40,
                  }}
                >
                  <Globe size={80} color="#111111" strokeWidth={2} />
                </View>

                <Text
                  style={{
                    color: "white",
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {slide.title}
                </Text>

                <Text
                  style={{
                    color: "#999999",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 40,
                  }}
                >
                  {slide.description}
                </Text>

                <ScrollView
                  style={{ width: "100%", maxHeight: 400 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang.code}
                      onPress={() => handleLanguageSelect(lang.code)}
                      style={{
                        backgroundColor:
                          selectedLanguage === lang.code
                            ? "#fed31920"
                            : "#1a1a1a",
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: selectedLanguage === lang.code ? 2 : 0,
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
                        <Text style={{ fontSize: 40, marginRight: 16 }}>
                          {lang.flag}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "white",
                              fontSize: 18,
                              fontWeight: "bold",
                            }}
                          >
                            {lang.nativeName}
                          </Text>
                          <Text
                            style={{
                              color: "#666666",
                              fontSize: 14,
                              marginTop: 2,
                            }}
                          >
                            {lang.name}
                          </Text>
                        </View>
                      </View>
                      {selectedLanguage === lang.code && (
                        <Check size={28} color="#fed319" strokeWidth={3} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          }

          if (slide.type === "coins") {
            return (
              <View
                key={index}
                style={{
                  width,
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 30,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fed319",
                    borderRadius: 100,
                    padding: 30,
                    marginBottom: 40,
                  }}
                >
                  <TrendingUp size={80} color="#111111" strokeWidth={2} />
                </View>

                <Text
                  style={{
                    color: "white",
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {slide.title}
                </Text>

                <Text
                  style={{
                    color: "#999999",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {slide.description}
                </Text>

                <Text
                  style={{
                    color: "#fed319",
                    fontSize: 14,
                    fontWeight: "bold",
                    marginBottom: 30,
                  }}
                >
                  {selectedCoins.length} selected (minimum 3)
                </Text>

                <ScrollView
                  style={{ width: "100%", maxHeight: 350 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {AVAILABLE_COINS.map((coin) => (
                    <Pressable
                      key={coin.id}
                      onPress={() => toggleCoin(coin.id)}
                      style={{
                        backgroundColor: selectedCoins.includes(coin.id)
                          ? "#fed31920"
                          : "#1a1a1a",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: selectedCoins.includes(coin.id) ? 2 : 0,
                        borderColor: "#fed319",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 18,
                            fontWeight: "bold",
                          }}
                        >
                          {coin.name}
                        </Text>
                        <Text
                          style={{
                            color: "#666666",
                            fontSize: 14,
                            marginTop: 2,
                          }}
                        >
                          {coin.symbol}
                        </Text>
                      </View>
                      {selectedCoins.includes(coin.id) && (
                        <Check size={28} color="#fed319" strokeWidth={3} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // Regular slides
          return (
            <View
              key={index}
              style={{
                width,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 40,
              }}
            >
              <View
                style={{
                  backgroundColor: "#fed319",
                  borderRadius: 100,
                  padding: 30,
                  marginBottom: 40,
                }}
              >
                <slide.icon size={80} color="#111111" strokeWidth={2} />
              </View>

              <Text
                style={{
                  color: "white",
                  fontSize: 32,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                {slide.title}
              </Text>

              <Text
                style={{
                  color: "#999999",
                  fontSize: 16,
                  textAlign: "center",
                  lineHeight: 24,
                }}
              >
                {slide.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 40, paddingBottom: 60 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? "#fed319" : "#333333",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {currentIndex === slides.length - 1 ? (
          <Pressable
            onPress={handleGetStarted}
            disabled={selectedCoins.length < 3}
            style={{
              backgroundColor:
                selectedCoins.length >= 3 ? "#fed319" : "#333333",
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: selectedCoins.length >= 3 ? "#111111" : "#666666",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Get Started
            </Text>
          </Pressable>
        ) : currentIndex === 0 ? null : (
          <Pressable
            onPress={goToNext}
            style={{
              backgroundColor: "#fed319",
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#111111", fontSize: 18, fontWeight: "bold" }}
            >
              Next
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
