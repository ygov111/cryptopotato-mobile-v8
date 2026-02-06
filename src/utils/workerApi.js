/**
 * Centralized API utility for Cloudflare Worker integration
 * Routes all external API calls through Worker with fallback to direct APIs
 */

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
    const response = await fetch(`${WORKER_BASE_URL}/api/prices`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        ids: coinIds,              // Changed from coinIds to ids
        vs_currency: "usd",        // Changed from vsCurrency to vs_currency
        include_24hr_change: true, // Changed to underscore style
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker prices API failed: ${response.status}`);
    }

    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed, falling back to CoinGecko direct:", workerError.message);

    const fallbackResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
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
 * Fetch market data via Worker with fallback
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
    const response = await fetch(`${WORKER_BASE_URL}/api/prices`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        endpoint: "markets",
        vs_currency: vsCurrency, // Standardizing to underscore
        order,
        per_page: perPage,       // Standardizing to underscore
        page,
        sparkline,
        price_change_percentage: priceChangePercentage,
      }),
    });

    if (!response.ok) throw new Error(`Worker market API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed, falling back to CoinGecko direct:", workerError.message);

    const fallbackResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=${order}&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=${priceChangePercentage}`,
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
 * Translate text via Worker with fallback
 */
export async function translateText(text, targetLang, sourceLang = "en") {
  try {
    const response = await fetch(`${WORKER_BASE_URL}/api/translate`, {
      method: "POST",
      headers: WORKER_HEADERS,
      body: JSON.stringify({
        text: text,        // Your Worker expects 'text'
        target: targetLang, // Changed from targetLang to target
        source: sourceLang, // Changed from sourceLang to source
      }),
    });

    if (!response.ok) throw new Error(`Worker translate API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed, falling back to backend translate:", workerError.message);

    const fallbackResponse = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });

    if (!fallbackResponse.ok) throw new Error("Both Worker and backend translate API failed");
    return await fallbackResponse.json();
  }
}

/**
 * Batch translate multiple texts via Worker
 */
export async function batchTranslate(texts, targetLang, sourceLang = "en") {
  try {
    const combinedText = texts.join("\n");
    const result = await translateText(combinedText, targetLang, sourceLang);
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
      body: JSON.stringify({
        prompt,
        temperature,
        maxOutputTokens,
      }),
    });

    if (!response.ok) throw new Error(`Worker Gemini API failed: ${response.status}`);
    return await response.json();
  } catch (workerError) {
    console.warn("⚠️ Worker failed for Gemini, no fallback available");
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
