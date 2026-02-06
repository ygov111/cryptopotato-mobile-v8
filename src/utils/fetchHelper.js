/**
 * Centralized fetch helper that properly handles base URLs in production APKs
 *
 * In Expo Go (dev): Relative paths work fine
 * In APK (production): Must use full URLs with EXPO_PUBLIC_BASE_URL
 */

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

/**
 * Smart fetch that works in both dev and production
 * @param {string} path - API path (e.g., "/api/leaderboard/get")
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Build full URL
  let url;
  if (BASE_URL && BASE_URL !== "undefined") {
    // Production: use full URL
    url = `${BASE_URL}${normalizedPath}`;
  } else {
    // Dev: use relative path (works in Expo Go)
    url = normalizedPath;
  }

  console.log(`🌐 API Fetch: ${url}`);

  return fetch(url, options);
}

/**
 * Convenience wrapper that returns JSON
 */
export async function apiFetchJson(path, options = {}) {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message || `API Error: ${response.status}`,
    );
  }

  return response.json();
}

export default apiFetch;
