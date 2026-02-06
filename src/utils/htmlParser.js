// Comprehensive HTML entity decoder
export function decodeHtmlEntities(text) {
  if (!text) return "";

  // First handle numeric entities (decimal and hex)
  let decoded = text
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );

  // Then handle named entities using unicode escape sequences
  const entityMap = {
    "&quot;": '"',
    "&apos;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&ndash;": "\u2013", // en dash
    "&mdash;": "\u2014", // em dash
    "&lsquo;": "\u2018", // left single quote
    "&rsquo;": "\u2019", // right single quote / apostrophe
    "&sbquo;": "\u201A", // single low quote
    "&ldquo;": "\u201C", // left double quote
    "&rdquo;": "\u201D", // right double quote
    "&bdquo;": "\u201E", // double low quote
    "&hellip;": "\u2026", // ellipsis
    "&trade;": "\u2122", // trademark
    "&copy;": "\u00A9", // copyright
    "&reg;": "\u00AE", // registered
    "&euro;": "\u20AC", // euro
    "&pound;": "\u00A3", // pound
    "&yen;": "\u00A5", // yen
  };

  // Replace all named entities
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  return decoded;
}

// Safe decode function - only decode if needed
export function safeDecode(str) {
  if (!str) return "";

  try {
    const decoded = decodeURIComponent(str);
    if (decoded !== str) {
      return decoded;
    }
    return str;
  } catch (e) {
    return str;
  }
}

// Parse inline content (text + links)
export function parseInlineContent(html) {
  const parts = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;

  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    // Add text before the link (preserve trailing space)
    if (match.index > lastIndex) {
      const textBefore = html.substring(lastIndex, match.index);
      const cleanText = decodeHtmlEntities(textBefore.replace(/<[^>]+>/g, ""));
      if (cleanText && cleanText.trim() !== "&nbsp;" && cleanText.trim()) {
        parts.push({ type: "text", content: cleanText });
      }
    }

    // Extract URL and link content
    const url = match[1]; // This is the href value
    const linkContent = match[2]; // This is everything between <a> and </a>

    // Skip if URL contains HTML tags (malformed href from WordPress)
    if (/<[^>]+>/i.test(url)) {
      lastIndex = match.index + match[0].length;
      continue;
    }

    // Check if link content is just an image - skip text links with images inside
    const hasImage = /<img[^>]*>/i.test(linkContent);
    if (hasImage) {
      lastIndex = match.index + match[0].length;
      continue; // Skip links that contain images
    }

    const linkText = decodeHtmlEntities(linkContent.replace(/<[^>]+>/g, ""));
    if (linkText && linkText.trim() && linkText.trim() !== "&nbsp;") {
      parts.push({ type: "link", url, text: linkText });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last link
  if (lastIndex < html.length) {
    const textAfter = html.substring(lastIndex);
    const cleanText = decodeHtmlEntities(textAfter.replace(/<[^>]+>/g, ""));
    if (cleanText && cleanText.trim() !== "&nbsp;" && cleanText.trim()) {
      parts.push({ type: "text", content: cleanText });
    }
  }

  return parts;
}

// Parse HTML into ordered content blocks (text, images, links inline)
export function parseHtmlContent(html) {
  if (!html) return [];

  const contentBlocks = [];

  // Remove script and style tags
  let cleaned = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // Match headings first (highest priority)
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch;
  const headingPositions = [];

  while ((headingMatch = headingRegex.exec(cleaned)) !== null) {
    headingPositions.push({
      start: headingMatch.index,
      end: headingMatch.index + headingMatch[0].length,
      type: "heading",
      level: parseInt(headingMatch[1]),
      content: headingMatch[2],
    });
  }

  // Match paragraphs
  const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let paraMatch;
  const paraPositions = [];

  while ((paraMatch = paraRegex.exec(cleaned)) !== null) {
    paraPositions.push({
      start: paraMatch.index,
      end: paraMatch.index + paraMatch[0].length,
      type: "paragraph",
      content: paraMatch[1],
    });
  }

  // Match images
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi;
  let imgMatch;
  const imgPositions = [];

  while ((imgMatch = imgRegex.exec(cleaned)) !== null) {
    imgPositions.push({
      start: imgMatch.index,
      end: imgMatch.index + imgMatch[0].length,
      type: "image",
      url: imgMatch[1],
    });
  }

  // Match Twitter/X blockquotes
  const tweetRegex =
    /<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][^>]*>([\s\S]*?)<\/blockquote>/gi;
  let tweetMatch;
  const tweetPositions = [];

  while ((tweetMatch = tweetRegex.exec(cleaned)) !== null) {
    const blockquoteContent = tweetMatch[1];

    // Extract ALL tweet text (all paragraphs inside blockquote)
    const paragraphs = [];
    const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let paraMatch;
    while ((paraMatch = paraRegex.exec(blockquoteContent)) !== null) {
      const text = decodeHtmlEntities(
        paraMatch[1].replace(/<[^>]+>/g, ""),
      ).trim();
      if (text && text !== "&nbsp;") {
        paragraphs.push(text);
      }
    }
    const tweetText = paragraphs.join("\n\n");

    // Extract Twitter URL
    const urlMatch = /href=["']([^"']*(?:twitter\.com|x\.com)[^"']*)["']/i.exec(
      blockquoteContent,
    );
    const tweetUrl = urlMatch ? urlMatch[1] : "";

    // Extract author (capture full name including spaces, stop at opening paren)
    const authorMatch = /—\s*([^(<]+)/i.exec(blockquoteContent);
    const author = authorMatch ? authorMatch[1].trim().replace(/^@/, "") : "";

    if (tweetText && tweetUrl) {
      tweetPositions.push({
        start: tweetMatch.index,
        end: tweetMatch.index + tweetMatch[0].length,
        type: "tweet",
        text: tweetText,
        url: tweetUrl,
        author: author,
      });
    }
  }

  // Combine all positions and sort by start position
  const allElements = [
    ...headingPositions,
    ...paraPositions,
    ...imgPositions,
    ...tweetPositions,
  ].sort((a, b) => a.start - b.start);

  // Process elements in order
  allElements.forEach((element) => {
    if (element.type === "image") {
      contentBlocks.push({ type: "image", url: element.url });
    } else if (element.type === "tweet") {
      contentBlocks.push({
        type: "tweet",
        text: element.text,
        url: element.url,
        author: element.author,
      });
    } else if (element.type === "heading") {
      const textParts = parseInlineContent(element.content);
      if (textParts.length > 0) {
        contentBlocks.push({
          type: "heading",
          level: element.level,
          parts: textParts,
        });
      }
    } else if (element.type === "paragraph") {
      const textParts = parseInlineContent(element.content);
      if (textParts.length > 0) {
        contentBlocks.push({ type: "paragraph", parts: textParts });
      }
    }
  });

  return contentBlocks;
}
