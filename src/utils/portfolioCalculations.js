export function calculatePortfolioStats(portfolio, prices) {
  let totalValue = 0;
  let totalInvested = 0;

  portfolio.forEach((asset) => {
    if (!asset.amount || !asset.buy_price) return;

    const coinId = asset.coin_id || asset.coinId;
    const currentPrice = prices[coinId]?.usd || 0;
    const invested = (asset.buy_price || asset.buyPrice) * asset.amount;
    const current = currentPrice * asset.amount;

    totalValue += current;
    totalInvested += invested;
  });

  const profitLoss = totalValue - totalInvested;
  const profitLossPercent =
    totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return { totalValue, totalInvested, profitLoss, profitLossPercent };
}

export function formatPrice(price) {
  if (!price) return "$0.00";
  if (price >= 1) {
    return `$${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else if (price >= 0.0001) {
    return `$${price.toFixed(6)}`;
  } else {
    return `$${price.toFixed(8)}`;
  }
}
