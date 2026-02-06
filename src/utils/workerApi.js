/**
 * Centralized API utility for Cloudflare Worker integration
 * Routes all external API calls through Worker with fallback to direct APIs
 */

import { apiFetch } from "./fetchHelper";

// HARDCODED FALLBACKS: These ensure the APK works even if EAS secrets fail to bake.
const WORKER_BASE_URL = process.env.EXPO_PUBLIC_WORKER_URL || "https://cpapp.cpotato.workers.dev";
const SHARED_SECRET = process.env.EXPO_PUBLIC_APP_SHARED_SECRET || "8f2b3c9a1e5d4b7f0a6c2e8b4d9f1a0c";

const WORKER_HEADERS = {
  "Content-Type": "application/json",
  "X-App-Shared-Secret": SHARED_SECRET,
};

/**
 * Fetch crypto prices via Worker with fallback to direct CoinGecko API
 */
export async function fetchCryptoPrices(coinIds) {
  try {
    const response = await fetch(`${WORKER_BASE_URL}/api/prices`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        coinIds,
        vsCurrency: "usd",
        include24hrChange: true,
      }),
    });

    if (!response.ok) throw new Error(`Worker prices API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker prices failed, falling back:", workerError.message);
    const fallbackResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "" },
      }
    );
    if (!fallbackResponse.ok) throw new Error("Both Worker and CoinGecko failed");
    return await fallbackResponse.json();
  }
}

/**
 * Fetch market data via Worker with fallback
 */
export async function fetchMarketData(params = {}) {
  const { vsCurrency = "usd", order = "market_cap_desc", perPage = 250, page = 1, sparkline = false, priceChangePercentage = "24h" } = params;
  try {
    const response = await fetch(`${WORKER_BASE_URL}/api/prices`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({ endpoint: "markets", vsCurrency, order, perPage, page, sparkline, priceChangePercentage }),
    });
    if (!response.ok) throw new Error(`Worker market API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker market failed, falling back:", workerError.message);
    const fallbackResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=${order}&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=${priceChangePercentage}`,
      {
        headers: { "x-cg-demo-api-key": process.env.EXPO_PUBLIC_COINGECKO_KEY || "" },
      }
    );
    if (!fallbackResponse.ok) throw new Error("Both Worker and CoinGecko failed");
    return await fallbackResponse.json();
  }
}

/**
 * Translate text via Worker with fallback to backend
 */
export async function translateText(text, targetLang, sourceLang = "en") {
  try {
    const response = await fetch(`${WORKER_BASE_URL}/api/translate`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });

    if (!response.ok) throw new Error(`Worker translate API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed, falling back to backend translate:", workerError.message);
    const fallbackResponse = await apiFetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });
    if (!fallbackResponse.ok) throw new Error(`Backend translate failed: ${fallbackResponse.status}`);
    return await fallbackResponse.json();
  }
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(texts, targetLang, sourceLang = "en") {
  try {
    const result = await translateText(texts.join("\n"), targetLang, sourceLang);
    return result.translatedText.split("\n");
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts;
  }
}

/**
 * Call Gemini AI via Worker
 */
export async function callGeminiAI(prompt, config = {}) {
  const { temperature = 0.7, maxOutputTokens = 1500 } = config;
  try {
    const response = await fetch(`${WORKER_BASE_URL}/api/gemini`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({ prompt, temperature, maxOutputTokens }),
    });
    if (!response.ok) throw new Error(`Worker Gemini API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker Gemini failed");
    throw new Error("Gemini API unavailable");
  }
}

/**
 * Health check
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
