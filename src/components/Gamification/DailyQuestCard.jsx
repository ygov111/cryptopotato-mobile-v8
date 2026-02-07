import { useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  Trophy,
  ExternalLink,
} from "lucide-react-native";
import useUser from "@/utils/auth/useUser";
import { useAuth } from "@/utils/auth/useAuth";
import { useArticleNavigation } from "@/hooks/useArticleNavigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/utils/fetchHelper";

export default function DailyQuestCard({
  quest,
  attempted,
  wasCorrect,
  loading,
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useUser();
  const { signUp } = useAuth();
  const queryClient = useQueryClient();
  const { handleLinkPress } = useArticleNavigation();
  const [showModal, setShowModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);

  const answerMutation = useMutation({
    mutationFn: async (answer) => {
      // Store attempt locally if not logged in
      if (!user) {
        const attemptData = {
          questId: quest.id,
          answer,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(
          "lastQuestAttempt",
          JSON.stringify(attemptData),
        );

        // Check if correct
        const isCorrect = answer === quest.correctAnswer;

        // Award points locally
        if (isCorrect) {
          const stored = await AsyncStorage.getItem("points");
          const parsed = stored ? JSON.parse(stored) : { points: 0 };
          parsed.points += 25;
          await AsyncStorage.setItem("points", JSON.stringify(parsed));
        }

        return {
          correct: isCorrect,
          pointsAwarded: isCorrect ? 25 : 0,
          correctAnswer: quest.correctAnswer,
        };
      }

      // Logged in user - use API
      const response = await apiFetch("/api/quest/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: quest.id, answer }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit answer");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["points"] });
      queryClient.invalidateQueries({ queryKey: ["userPoints"] });
      queryClient.invalidateQueries({ queryKey: ["dailyQuest"] });
    },
  });

  const handleAnswer = (answer) => {
    if (attempted || result) return;

    setSelectedAnswer(answer);
    answerMutation.mutate(answer);
  };

  const handleCardPress = () => {
    // Use article navigation hook for proper native article rendering
    if (quest?.articleUrl) {
      handleLinkPress(quest.articleUrl);
    }
  };

  const handleTakeQuizPress = (e) => {
    // Stop propagation so it doesn't trigger article navigation
    e?.stopPropagation?.();
    setShowModal(true);
  };

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: "#fed319",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fed319" />
        <Text style={{ color: "#999999", fontSize: 14, marginTop: 12 }}>
          Loading today's quest...
        </Text>
      </View>
    );
  }

  if (!quest) return null;

  return (
    <>
      <Pressable
        onPress={handleCardPress}
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: "#fed319",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              backgroundColor: "#fed319",
              borderRadius: 12,
              padding: 10,
              marginRight: 12,
            }}
          >
            <HelpCircle size={24} color="#111111" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#fed319", fontSize: 12, fontWeight: "bold" }}
            >
              DAILY QUEST
            </Text>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              {quest.articleTitle?.substring(0, 40) || "Crypto Trivia"}...
            </Text>
          </View>
          {attempted && (
            <View
              style={{
                backgroundColor: wasCorrect ? "#10b98120" : "#ef444420",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  color: wasCorrect ? "#10b981" : "#ef4444",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {wasCorrect ? "✓ Correct!" : "✗ Wrong"}
              </Text>
            </View>
          )}
        </View>

        <Text style={{ color: "#999999", fontSize: 14, marginBottom: 12 }}>
          Read the article then take the quiz for 25 points! 🎯
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Trophy size={16} color="#fed319" />
            <Text
              style={{
                color: "#fed319",
                fontSize: 14,
                fontWeight: "bold",
                marginLeft: 6,
              }}
            >
              +25 Potato Points
            </Text>
          </View>

          {!attempted && (
            <Pressable
              onPress={handleTakeQuizPress}
              style={{
                backgroundColor: "#fed319",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: "#111111", fontSize: 12, fontWeight: "bold" }}
              >
                Take Quiz
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
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
                width: 40,
                height: 4,
                backgroundColor: "#333333",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                color: "#fed319",
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              DAILY CRYPTO QUEST
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              {quest.question}
            </Text>

            <Text
              style={{
                color: "#666666",
                fontSize: 12,
                marginBottom: 24,
              }}
            >
              Based on: {quest.articleTitle}
            </Text>

            {result ? (
              <View
                style={{
                  backgroundColor: result.correct ? "#10b98120" : "#ef444420",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                {result.correct ? (
                  <CheckCircle size={48} color="#10b981" />
                ) : (
                  <XCircle size={48} color="#ef4444" />
                )}
                <Text
                  style={{
                    color: result.correct ? "#10b981" : "#ef4444",
                    fontSize: 24,
                    fontWeight: "bold",
                    marginTop: 12,
                  }}
                >
                  {result.correct ? "Correct!" : "Wrong!"}
                </Text>
                <Text
                  style={{
                    color: result.correct ? "#10b981" : "#ef4444",
                    fontSize: 16,
                    marginTop: 8,
                  }}
                >
                  {result.correct
                    ? `+${result.pointsAwarded} Potato Points! 🥔`
                    : `Correct answer: ${result.correctAnswer}`}
                </Text>
              </View>
            ) : attempted ? (
              <View
                style={{
                  backgroundColor: wasCorrect ? "#10b98120" : "#ef444420",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: wasCorrect ? "#10b981" : "#ef4444",
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {wasCorrect
                    ? "You already got this one right!"
                    : "Already attempted today"}
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                {quest.answers.map((answer, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleAnswer(answer)}
                    disabled={answerMutation.isPending}
                    style={{
                      backgroundColor:
                        selectedAnswer === answer ? "#fed31920" : "#111111",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: selectedAnswer === answer ? 2 : 1,
                      borderColor:
                        selectedAnswer === answer ? "#fed319" : "#333333",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {answer}
                    </Text>
                  </Pressable>
                ))}

                {answerMutation.isPending && (
                  <ActivityIndicator
                    size="large"
                    color="#fed319"
                    style={{ marginTop: 20 }}
                  />
                )}
              </View>
            )}

            <Pressable
              onPress={() => setShowModal(false)}
              style={{
                backgroundColor: "#fed319",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#111111", fontSize: 16, fontWeight: "bold" }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
