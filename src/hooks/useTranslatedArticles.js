import { useState, useEffect, useCallback } from "react";
import { batchTranslate } from "@/utils/translationCache";

// Decode HTML entities
function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, "");
}

/**
 * useTranslatedArticles Hook
 *
 * Strategy: Show English first, translate in background
 * Uses Worker cache (permanent) + React Query cache (session)
 * 1. Show English titles immediately
 * 2. Batch translate all titles via Worker (checks Worker cache first)
 * 3. Fade in translations as they arrive
 */
export function useTranslatedArticles(articles, targetLang) {
  const [translatedArticles, setTranslatedArticles] = useState([]);
  const [loadingTitles, setLoadingTitles] = useState(new Set());

  const translateArticles = useCallback(async () => {
    // Step 1: Show articles with English titles immediately
    const articlesWithEnglish = articles.map((article) => ({
      ...article,
      translatedTitle: null, // Will show English
      isTranslated: false,
    }));
    setTranslatedArticles(articlesWithEnglish);

    // Step 2: Extract titles to translate
    const titlesToTranslate = articles.map(
      (article) => article.title?.rendered || "",
    );

    // Create loading set using article IDs
    const loadingIds = new Set(articles.map((article) => article.id));
    setLoadingTitles(loadingIds);

    try {
      // Step 3: Batch translate via Worker (Worker checks its cache first)
      const translations = await batchTranslate(titlesToTranslate, targetLang);

      // Step 4: Update articles with translations
      const updated = articles.map((article, i) => ({
        ...article,
        translatedTitle: decodeHtmlEntities(translations[i]),
        isTranslated: true,
      }));

      setTranslatedArticles(updated);
      setLoadingTitles(new Set());
    } catch (error) {
      console.error("Failed to translate articles:", error);
      setLoadingTitles(new Set());
    }
  }, [articles, targetLang]);

  useEffect(() => {
    if (!articles || articles.length === 0 || targetLang === "en") {
      setTranslatedArticles(articles || []);
      return;
    }

    translateArticles();
  }, [translateArticles, articles, targetLang]);

  return { translatedArticles, loadingTitles };
}
