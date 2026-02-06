import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/utils/fetchHelper";

export function useUserPoints(user) {
  const { data: userPoints } = useQuery({
    queryKey: ["userPoints", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/rewards/get");
        if (!response.ok) throw new Error("Failed to fetch points");
        const data = await response.json();
        return data.points || 0;
      }
      const stored = await AsyncStorage.getItem("points");
      const parsed = stored
        ? JSON.parse(stored)
        : { points: 0, lastClaimAt: null };
      return parsed.points || 0;
    },
    refetchInterval: 2000,
    staleTime: 0,
  });

  return userPoints || 0;
}
