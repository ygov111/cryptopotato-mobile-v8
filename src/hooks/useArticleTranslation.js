import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translateText } from "@/utils/workerApi";
import { parseHtmlContent } from "@/utils/htmlParser";
import { DEFAULT_LANGUAGE } from "@/utils/i18n";

export function useArticleTranslation(decodedTitle, rawContent) {
  const [selectedLang, setSelectedLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  // Handle translation
  const handleTranslate = useCallback(
    async (langCode) => {
      if (langCode === "en") {
        setShowOriginal(true);
        setSelectedLang("en");
        return;
      }

      setSelectedLang(langCode);
      setIsTranslating(true);
      setShowOriginal(false);

      try {
        // Translate title using Worker API (with automatic fallback)
        const titleData = await translateText(decodedTitle, langCode, "en");
        setTranslatedTitle(titleData.translatedText);

        // Translate content using Worker API (with automatic fallback)
        const contentData = await translateText(rawContent, langCode, "en");
        const translatedBlocks = parseHtmlContent(contentData.translatedText);
        setTranslatedContent(translatedBlocks);
      } catch (error) {
        console.error("Translation error:", error);

        // More helpful error message with specific reason
        const errorMessage = error.message || "Unknown error";
        Alert.alert(
          "Translation Failed",
          `Could not translate to ${langCode.toUpperCase()}: ${errorMessage}\n\nShowing original English version instead.`,
          [{ text: "OK" }],
        );

        // Fall back to English
        setSelectedLang("en");
        setShowOriginal(true);
        setTranslatedContent(null);
        setTranslatedTitle(null);
      } finally {
        setIsTranslating(false);
      }
    },
    [decodedTitle, rawContent],
  );

  // Auto-load user's language and auto-translate on mount
  useEffect(() => {
    let isMounted = true;

    const loadAndTranslate = async () => {
      try {
        const saved = await AsyncStorage.getItem("userLanguage");
        if (saved && isMounted) {
          setLanguage(saved);
          if (saved !== "en") {
            await handleTranslate(saved);
          }
        }
      } catch (error) {
        console.error("Failed to auto-translate:", error);
      }
    };

    loadAndTranslate();

    return () => {
      isMounted = false;
    };
  }, [handleTranslate]);

  const resetToOriginal = () => {
    setShowOriginal(true);
    setSelectedLang("en");
  };

  return {
    selectedLang,
    isTranslating,
    translatedContent,
    translatedTitle,
    showOriginal,
    language,
    handleTranslate,
    resetToOriginal,
  };
}
