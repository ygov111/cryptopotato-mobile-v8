import { batchTranslate as workerBatchTranslate } from "@/utils/workerApi";

/**
 * Translation cache removed - now using React Query session-based cache only
 * All permanent caching is handled by Cloudflare Worker (global cache)
 * and React Query (session-based in-memory cache)
 */

/**
 * Batch translate multiple texts via Worker
 * Returns array of translated texts in same order
 */
export async function batchTranslate(texts, targetLang, sourceLang = "en") {
  try {
    // Use Worker API with automatic fallback
    const translatedTexts = await workerBatchTranslate(
      texts,
      targetLang,
      sourceLang,
    );
    return translatedTexts;
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts; // Return original texts on failure
  }
}
