import { useQuery } from "@tanstack/react-query";
import { fetchCryptoPrices } from "@/utils/workerApi";

export function usePortfolioPrices(portfolio) {
  const {
    data: prices = {},
    isLoading: loadingPrices,
    refetch: refetchPrices,
  } = useQuery({
    queryKey: ["portfolioPrices", portfolio],
    queryFn: async () => {
      if (portfolio.length === 0) return {};
      const coinIds = portfolio.map((p) => p.coin_id || p.coinId).join(",");

      // Use Worker API with automatic fallback to direct CoinGecko
      const data = await fetchCryptoPrices(coinIds);
      return data;
    },
    enabled: portfolio.length > 0,
    refetchInterval: 30000, // 30 seconds UI refresh (Worker caches for 5 min)
    staleTime: 20000, // Keep data fresh for 20 seconds before refetching
    cacheTime: 300000,
  });

  return { prices, loadingPrices };
}
