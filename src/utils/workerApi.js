/**
 * Centralized API utility for Cloudflare Worker integration
 * Routes all external API calls through Worker with fallback to direct APIs
 */

import { apiFetch } from "./fetchHelper";

const WORKER_BASE_URL = "https://cpapp.cpotato.workers.dev";
const WORKER_HEADERS = {
  "X-App-Shared-Secret": "8f2b3c9a1e5d4b7f0a6c2e8b4d9f1a0c",
  "User-Agent": "CryptoPotatoMobile/1.0",
  "Content-Type": "application/json",
};

/**
 * Fetch crypto prices via Worker with fallback to direct CoinGecko API
 */
export async function fetchCryptoPrices(coinIds) {
  try {
    // Ensure coinIds is a string, not an array
    const idsString = Array.isArray(coinIds) ? coinIds.join(",") : coinIds;
    
    const response = await fetch(`${WORKER_BASE_URL}/api/prices`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        ids: idsString,  // Send as string, not array
        vs_currency: "usd",
        include_24hr_change: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker prices API failed: ${response.status}`);
    }

    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed, falling back to CoinGecko direct:", workerError.message);

    const fallbackResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${Array.isArray(coinIds) ? coinIds.join(",") : coinIds}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "",
        },
      }
    );

    if (!fallbackResponse.ok) throw new Error("Both Worker and CoinGecko direct API failed");
    return await fallbackResponse.json();
  }
}

/**
 * Fetch market data via Worker with fallback to direct CoinGecko API
 * @param {Object} params - Market data parameters
 * @returns {Promise<Array>} Market data array in CoinGecko format
 */
export async function fetchMarketData(params = {}) {
  const {
    vsCurrency = "usd",
    order = "market_cap_desc",
    perPage = 250,
    page = 1,
    sparkline = false,
    priceChangePercentage = "24h",
  } = params;

  try {
    // Try Worker first
    const response = await fetch(`${WORKER_BASE_URL}/api/prices`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        endpoint: "markets",
        vsCurrency,
        order,
        perPage,
        page,
        sparkline,
        priceChangePercentage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker market API failed: ${response.status}`);
    }

    return await response.json();
  } catch (workerError) {
    console.warn(
      "⚠️ Worker failed, falling back to CoinGecko direct:",
      workerError.message,
    );

    // Fallback to direct CoinGecko API
    const fallbackResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=${order}&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=${priceChangePercentage}`,
      {
        headers: {
          "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "",
        },
      },
    );

    if (!fallbackResponse.ok) {
      throw new Error("Both Worker and CoinGecko direct API failed");
    }

    return await fallbackResponse.json();
  }
}

/**
 * Translate text via Worker with fallback to direct Google Translate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<Object>} Translation result with translatedText, sourceLang, targetLang, cached
 */
export async function translateText(text, targetLang, sourceLang = "en") {
  try {
    // Try Worker first
    const response = await fetch(`${WORKER_BASE_URL}/api/translate`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker translate API failed: ${response.status}`);
    }

    return await response.json();
  } catch (workerError) {
    console.warn(
      "⚠️ Worker failed, falling back to backend translate:",
      workerError.message,
    );

    // Fallback to backend translate endpoint using apiFetch (works in APK)
    const fallbackResponse = await apiFetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
      }),
    });

    if (!fallbackResponse.ok) {
      const errorText = await fallbackResponse.text();
      throw new Error(
        `Backend translate failed: ${fallbackResponse.status} ${errorText}`,
      );
    }

    return await fallbackResponse.json();
  }
}

/**
 * Batch translate multiple texts via Worker
 * @param {Array<string>} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<Array<string>>} Array of translated texts
 */
export async function batchTranslate(texts, targetLang, sourceLang = "en") {
  try {
    // Join texts with newline separator for batch processing
    const combinedText = texts.join("\n");

    const result = await translateText(combinedText, targetLang, sourceLang);

    // Split the translated text back into array
    const translatedTexts = result.translatedText.split("\n");

    return translatedTexts;
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts; // Return original texts on failure
  }
}

/**
 * Call Gemini AI via Worker with fallback to direct API
 * @param {string} prompt - Prompt for Gemini AI
 * @param {Object} config - Generation config
 * @returns {Promise<Object>} Gemini response
 */
export async function callGeminiAI(prompt, config = {}) {
  const { temperature = 0.7, maxOutputTokens = 1500 } = config;

  try {
    // Try Worker first
    const response = await fetch(`${WORKER_BASE_URL}/api/gemini`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        prompt,
        temperature,
        maxOutputTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker Gemini API failed: ${response.status}`);
    }

    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed for Gemini, no fallback available in mobile");
    throw new Error("Gemini API unavailable - Worker is down");
  }
}

/**
 * Health check for Worker availability
 * @returns {Promise<boolean>} True if Worker is healthy
 */
export async function isWorkerHealthy() {
  try {
    const response = await fetch(`${WORKER_BASE_URL}/health`, {
      headers: WORKER_HEADERS,
      timeout: 5000,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  fetchCryptoPrices,
  fetchMarketData,
  translateText,
  batchTranslate,
  callGeminiAI,
  isWorkerHealthy,
};
