import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/fetchHelper";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      console.log("🏆 useLeaderboard: Fetching leaderboard data...");
      try {
        const response = await apiFetch("/api/leaderboard/get");

        console.log("🏆 useLeaderboard: Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ useLeaderboard: Failed to fetch leaderboard:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          throw new Error(
            errorData.message ||
              errorData.error ||
              "Failed to fetch leaderboard",
          );
        }

        const data = await response.json();
        console.log("✅ useLeaderboard: Data received:", {
          leaderboardCount: data.leaderboard?.length || 0,
          prizesCount: data.prizes?.length || 0,
        });

        return data;
      } catch (error) {
        console.error("❌ useLeaderboard: Fetch error:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests
  });
}

export function useMyRank() {
  return useQuery({
    queryKey: ["my-rank"],
    queryFn: async () => {
      console.log("📊 useMyRank: Fetching my rank...");
      try {
        const response = await apiFetch("/api/leaderboard/my-rank");

        console.log("📊 useMyRank: Response status:", response.status);

        if (!response.ok) {
          if (response.status === 401) {
            console.log("📊 useMyRank: User not authenticated");
            return { rank: null, points: 0, nearby: [] };
          }
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ useMyRank: Failed to fetch rank:", {
            status: response.status,
            errorData,
          });
          throw new Error(errorData.message || "Failed to fetch rank");
        }

        const data = await response.json();
        console.log("✅ useMyRank: Data received:", data);
        return data;
      } catch (error) {
        console.error("❌ useMyRank: Fetch error:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
}
