import { useCallback } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { isInternalLink, extractArticleSlug } from "@/utils/articleHelpers";

export function useArticleNavigation() {
  const router = useRouter();

  const handleLinkPress = useCallback(
    async (linkUrl) => {
      if (isInternalLink(linkUrl)) {
        // Internal link - try to fetch and navigate to article, fallback to WebView
        try {
          const slug = extractArticleSlug(linkUrl);
          if (!slug) {
            router.push({
              pathname: "/(tabs)/webview",
              params: { url: encodeURIComponent(linkUrl) },
            });
            return;
          }

          // Fetch the article from WordPress API
          const response = await fetch(
            `https://cryptopotato.com/wp-json/wp/v2/posts?slug=${slug}&_embed`,
            {
              headers: {
                "X-Anything-Request": "cryptopotato-mvp",
              },
            },
          );

          if (!response.ok) {
            router.push({
              pathname: "/(tabs)/webview",
              params: { url: encodeURIComponent(linkUrl) },
            });
            return;
          }

          const posts = await response.json();
          if (posts.length === 0) {
            router.push({
              pathname: "/(tabs)/webview",
              params: { url: encodeURIComponent(linkUrl) },
            });
            return;
          }

          const post = posts[0];
          const linkedImageUrl =
            post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";

          // Navigate to the article natively
          router.push({
            pathname: "/(tabs)/article",
            params: {
              url: encodeURIComponent(post.link),
              title: encodeURIComponent(post.title?.rendered || ""),
              content: encodeURIComponent(post.content?.rendered || ""),
              imageUrl: encodeURIComponent(linkedImageUrl),
            },
          });
        } catch (error) {
          router.push({
            pathname: "/(tabs)/webview",
            params: { url: encodeURIComponent(linkUrl) },
          });
        }
      } else {
        // External link - open in device's native browser
        Linking.openURL(linkUrl);
      }
    },
    [router],
  );

  return { handleLinkPress };
}
