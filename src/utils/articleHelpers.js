// Check if URL is internal (CryptoPotato)
export function isInternalLink(url) {
  return url.includes("cryptopotato.com");
}

// Extract article slug from CryptoPotato URL
export function extractArticleSlug(url) {
  const match = url.match(/cryptopotato\.com\/([^\/]+)\/?$/);
  return match ? match[1] : null;
}

// Format date/time with UTC
export function formatDate(dateString) {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toUTCString().split(" ")[4]; // Extract HH:MM:SS
  return `${dateStr} • ${timeStr} UTC`;
}
