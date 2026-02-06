import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { apiFetch } from "@/utils/fetchHelper";

export function usePortfolio(user) {
  const queryClient = useQueryClient();

  const { data: portfolio = [], isLoading } = useQuery({
    queryKey: ["portfolio", user?.id],
    queryFn: async () => {
      if (user?.id) {
        const response = await apiFetch("/api/portfolio/list", {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch portfolio");
        const data = await response.json();
        return data.portfolio || [];
      } else {
        const stored = await AsyncStorage.getItem("portfolio");
        const parsed = stored ? JSON.parse(stored) : [];
        return parsed.sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0),
        );
      }
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId) => {
      if (user?.id) {
        const response = await apiFetch("/api/portfolio/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: assetId }),
        });
        if (!response.ok) throw new Error("Failed to delete asset");
        return await response.json();
      } else {
        const newPortfolio = portfolio.filter((p) => p.id !== assetId);
        await AsyncStorage.setItem("portfolio", JSON.stringify(newPortfolio));
        return newPortfolio;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }) => {
      if (user?.id) {
        const response = await apiFetch("/api/portfolio/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, direction }),
        });
        if (!response.ok) throw new Error("Failed to reorder");
        return await response.json();
      } else {
        const currentIndex = portfolio.findIndex((p) => p.id === id);
        if (currentIndex === -1) return;

        const newPortfolio = [...portfolio];
        const swapIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (swapIndex < 0 || swapIndex >= newPortfolio.length) return;

        [newPortfolio[currentIndex], newPortfolio[swapIndex]] = [
          newPortfolio[swapIndex],
          newPortfolio[currentIndex],
        ];
        newPortfolio.forEach((item, index) => {
          item.display_order = index;
        });

        await AsyncStorage.setItem("portfolio", JSON.stringify(newPortfolio));
        return newPortfolio;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  const addAssetMutation = useMutation({
    mutationFn: async (asset) => {
      // Get the latest portfolio data from the query cache
      const latestPortfolio =
        queryClient.getQueryData(["portfolio", user?.id]) || [];

      // Check for duplicates using the latest data
      const isDuplicate = latestPortfolio.some(
        (p) => (p.coin_id || p.coinId) === asset.coin_id,
      );

      if (isDuplicate) {
        throw new Error("DUPLICATE");
      }

      if (user?.id) {
        const response = await apiFetch("/api/portfolio/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(asset),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Throw the server error message
          throw new Error(errorData.error || "Failed to add asset");
        }

        return await response.json();
      } else {
        const maxOrder =
          latestPortfolio.length > 0
            ? Math.max(...latestPortfolio.map((p) => p.display_order || 0))
            : -1;
        const newPortfolio = [
          ...latestPortfolio,
          {
            ...asset,
            id: Date.now(),
            display_order: maxOrder + 1,
          },
        ];
        await AsyncStorage.setItem("portfolio", JSON.stringify(newPortfolio));
        return newPortfolio;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error) => {
      console.error("Add asset error:", error);

      if (
        error.message === "DUPLICATE" ||
        error.message.includes("already in your portfolio")
      ) {
        Alert.alert("Already Added", "This coin is already in your portfolio!");
      } else if (error.message.includes("Missing required fields")) {
        Alert.alert(
          "Error",
          "Missing coin information. Please try selecting the coin again.",
        );
      } else {
        Alert.alert(
          "Error",
          error.message || "Failed to add coin to portfolio",
        );
      }
    },
  });

  const editAssetMutation = useMutation({
    mutationFn: async ({ id, amount, buy_price }) => {
      if (user?.id) {
        const response = await apiFetch("/api/portfolio/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, amount, buy_price }),
        });
        if (!response.ok) throw new Error("Failed to update asset");
        return await response.json();
      } else {
        const newPortfolio = portfolio.map((p) =>
          p.id === id ? { ...p, amount, buyPrice: buy_price } : p,
        );
        await AsyncStorage.setItem("portfolio", JSON.stringify(newPortfolio));
        return newPortfolio;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  return {
    portfolio,
    isLoading,
    deleteAssetMutation,
    reorderMutation,
    addAssetMutation,
    editAssetMutation,
  };
}
