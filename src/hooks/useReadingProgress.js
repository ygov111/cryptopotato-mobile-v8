import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/auth/useUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/utils/fetchHelper";

export function useReadingProgress() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  // Fetch reading progress
  const { data: progress, isLoading } = useQuery({
    queryKey: ["readingProgress", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/articles/reading-progress");
        if (!response.ok) throw new Error("Failed to fetch reading progress");
        return await response.json();
      }

      // For non-authenticated users, use local storage
      const stored = await AsyncStorage.getItem("readingProgress");
      if (stored) {
        const data = JSON.parse(stored);
        // Check if it's from today
        const today = new Date().toDateString();
        if (data.date === today) {
          return {
            articlesRead: data.articlesRead || 0,
            completed: (data.articlesRead || 0) >= 3,
            pointsToday: data.pointsToday || 0,
            readArticles: data.readArticles || [],
          };
        }
      }

      return {
        articlesRead: 0,
        completed: false,
        pointsToday: 0,
        readArticles: [],
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
  });

  // Track article read mutation
  const trackReadMutation = useMutation({
    mutationFn: async (articleUrl) => {
      if (user?.id) {
        const response = await apiFetch("/api/articles/track-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleUrl }),
        });

        if (!response.ok) throw new Error("Failed to track article read");
        return await response.json();
      }

      // For non-authenticated users, use local storage
      const stored = await AsyncStorage.getItem("readingProgress");
      let data = stored ? JSON.parse(stored) : null;

      const today = new Date().toDateString();

      // Reset if not from today
      if (!data || data.date !== today) {
        data = {
          date: today,
          articlesRead: 0,
          pointsToday: 0,
          readArticles: [],
        };
      }

      // Check if already read
      if (data.readArticles.includes(articleUrl)) {
        return { alreadyRead: true };
      }

      // Calculate points
      let points = 0;
      if (data.articlesRead === 0) points = 10;
      else if (data.articlesRead === 1) points = 15;
      else if (data.articlesRead === 2) points = 25;

      // Update data
      data.articlesRead += 1;
      data.pointsToday += points;
      data.readArticles.push(articleUrl);

      await AsyncStorage.setItem("readingProgress", JSON.stringify(data));

      // Also update local points
      const pointsStored = await AsyncStorage.getItem("points");
      const pointsData = pointsStored
        ? JSON.parse(pointsStored)
        : { points: 0, lastClaimAt: null };
      pointsData.points += points;
      await AsyncStorage.setItem("points", JSON.stringify(pointsData));

      return {
        success: true,
        points,
        articleNumber: data.articlesRead,
        completed: data.articlesRead >= 3,
        gotBonus: data.articlesRead === 3,
      };
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["readingProgress"] });
      queryClient.invalidateQueries({ queryKey: ["userPoints"] });
    },
  });

  return {
    progress: progress || {
      articlesRead: 0,
      completed: false,
      pointsToday: 0,
      readArticles: [],
    },
    isLoading,
    trackArticleRead: trackReadMutation.mutateAsync,
  };
}
