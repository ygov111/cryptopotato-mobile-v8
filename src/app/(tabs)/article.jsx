import { View, Text, ScrollView, Share, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUser from "@/utils/auth/useUser";
import { getUIText } from "@/utils/i18n";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useArticleTranslation } from "@/hooks/useArticleTranslation";
import { useArticleNavigation } from "@/hooks/useArticleNavigation";
import { useArticleRewards } from "@/hooks/useArticleRewards";
import {
  safeDecode,
  parseHtmlContent,
  decodeHtmlEntities,
} from "@/utils/htmlParser";
import { apiFetch } from "@/utils/fetchHelper";
import ImageLightbox from "@/components/ImageLightbox";
import LanguageSelector, { LANGUAGES } from "@/components/LanguageSelector";
import { ArticleHeader } from "@/components/Article/ArticleHeader";
import { RewardToast } from "@/components/Article/RewardToast";
import { TranslationOverlay } from "@/components/Article/TranslationOverlay";
import { FeaturedImage } from "@/components/Article/FeaturedImage";
import { LanguageBadge } from "@/components/Article/LanguageBadge";
import { ArticleMetadata } from "@/components/Article/ArticleMetadata";
import { ContentRenderer } from "@/components/Article/ContentRenderer";
import DailyQuestCard from "@/components/Gamification/DailyQuestCard";

// Article page with translation, rewards, and reading progress
export default function Article() {
  const { url, title, content, imageUrl, author, date } =
    useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();

  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLangSelector, setShowLangSelector] = useState(false);

  // Safely decode params AND decode HTML entities in title
  const decodedTitle = decodeHtmlEntities(safeDecode(title) || "Article");
  const decodedUrl = safeDecode(url);
  const decodedImageUrl = safeDecode(imageUrl);
  const rawContent = safeDecode(content);
  const decodedAuthor = safeDecode(author) || "CryptoPotato";
  const decodedDate = safeDecode(date);

  // Parse HTML content
  const contentBlocks = parseHtmlContent(rawContent);

  // Custom hooks
  const {
    selectedLang,
    isTranslating,
    translatedContent,
    translatedTitle,
    showOriginal,
    language,
    handleTranslate,
    resetToOriginal,
  } = useArticleTranslation(decodedTitle, rawContent);

  const { handleLinkPress } = useArticleNavigation();
  const { showRewardToast, rewardInfo } = useArticleRewards(decodedUrl);

  // Get reading progress
  const { progress } = useReadingProgress();

  // Fetch user points using apiFetch
  const { data: userPoints } = useQuery({
    queryKey: ["userPoints", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/rewards/get");
        if (!response.ok) throw new Error("Failed to fetch points");
        const data = await response.json();
        return data.points || 0;
      }
      const stored = await AsyncStorage.getItem("points");
      const parsed = stored
        ? JSON.parse(stored)
        : { points: 0, lastClaimAt: null };
      return parsed.points || 0;
    },
    refetchInterval: 2000,
    staleTime: 0,
  });

  // Fetch today's quest using apiFetch
  const { data: questData } = useQuery({
    queryKey: ["dailyQuest"],
    queryFn: async () => {
      const response = await apiFetch("/api/quest/get");
      if (!response.ok) throw new Error("Failed to fetch quest");
      return await response.json();
    },
    refetchInterval: 60000,
  });

  // Check if this article is the quest article
  const isQuestArticle = useMemo(() => {
    if (!questData || !questData.quest || !questData.quest.articleUrl) {
      return false;
    }
    console.log(
      "Checking if quest article:",
      questData.quest.articleUrl,
      "matches current URL:",
      decodedUrl,
    );
    return questData.quest.articleUrl === decodedUrl;
  }, [questData, decodedUrl]);

  const t = (key) => getUIText(key, language);

  // Get current language info
  const currentLang =
    LANGUAGES.find((lang) => lang.code === selectedLang) || LANGUAGES[0];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${decodedTitle}\n\n${decodedUrl}`,
        url: decodedUrl,
        title: decodedTitle,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Could not share article");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* Header */}
      <ArticleHeader
        insets={insets}
        onBack={() => router.back()}
        t={t}
        progress={progress}
        userPoints={userPoints}
        onPointsPress={() => router.push("/(tabs)/rewards")}
        selectedLang={selectedLang}
        onTranslatePress={() => setShowLangSelector(true)}
        onSharePress={handleShare}
      />

      {/* Reward Toast */}
      {showRewardToast && rewardInfo && (
        <RewardToast insets={insets} rewardInfo={rewardInfo} />
      )}

      {/* Translation Loading Overlay */}
      <TranslationOverlay
        isTranslating={isTranslating}
        currentLang={currentLang}
      />

      {/* Article Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Image */}
        <FeaturedImage imageUrl={decodedImageUrl} onPress={setLightboxImage} />

        {/* Article Body */}
        <View style={{ padding: 20 }}>
          {/* Language Badge (if translated) */}
          {!showOriginal && translatedContent && (
            <LanguageBadge
              currentLang={currentLang}
              onShowOriginal={resetToOriginal}
            />
          )}

          {/* Title */}
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 12,
              lineHeight: 32,
              textAlign: currentLang.rtl ? "right" : "left",
            }}
          >
            {showOriginal ? decodedTitle : translatedTitle || decodedTitle}
          </Text>

          {/* Metadata: Author and Date */}
          <ArticleMetadata author={decodedAuthor} date={decodedDate} />

          {/* Content Blocks in Order */}
          <ContentRenderer
            contentBlocks={
              showOriginal ? contentBlocks : translatedContent || contentBlocks
            }
            onImagePress={setLightboxImage}
            onLinkPress={handleLinkPress}
          />

          {/* Daily Quest (if this is the quest article) */}
          {isQuestArticle && questData?.quest && (
            <View
              style={{
                marginTop: 32,
                paddingTop: 32,
                borderTopWidth: 1,
                borderColor: "#333333",
              }}
            >
              <Text
                style={{
                  color: "#fed319",
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 16,
                }}
              >
                📖 Test Your Knowledge
              </Text>
              <DailyQuestCard
                quest={questData.quest}
                attempted={questData.attempted}
                wasCorrect={questData.wasCorrect}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Lightbox */}
      <ImageLightbox
        visible={!!lightboxImage}
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLangSelector}
        onClose={() => setShowLangSelector(false)}
        onSelect={handleTranslate}
        currentLang={selectedLang}
      />
    </View>
  );
}
