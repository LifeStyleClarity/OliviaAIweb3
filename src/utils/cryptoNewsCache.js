// Crypto news caching utility
class CryptoNewsCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  getCachedNews() {
    const cached = this.cache.get('crypto_news');
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  setCachedNews(news) {
    this.cache.set('crypto_news', {
      data: news,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export const cryptoNewsCache = new CryptoNewsCache();

// Fast crypto news alternatives (without web search)
export const getFastCryptoUpdate = () => {
  const updates = [
    "🚀 Bitcoin is showing strong momentum today! The market sentiment is bullish with increased institutional adoption.",
    "📈 TON ecosystem is expanding rapidly with new DeFi protocols launching. Great time to explore opportunities!",
    "⚡ DeFi yields are attractive right now, with several protocols offering competitive staking rewards.",
    "🔥 Meme coins are trending, but remember to DYOR (Do Your Own Research) before investing!",
    "💎 Major crypto exchanges are adding new trading pairs. Perfect time to diversify your portfolio!"
  ];
  
  return updates[Math.floor(Math.random() * updates.length)];
};

// Pre-generated crypto insights (updated periodically)
export const getCryptoInsights = () => {
  return [
    "The crypto market is experiencing healthy volatility with Bitcoin leading the charge.",
    "DeFi protocols on TON are seeing increased liquidity and user adoption.",
    "Institutional investors are showing renewed interest in crypto assets.",
    "Layer 2 solutions are gaining traction, improving transaction speeds and costs.",
    "NFT markets are evolving with new utility-focused projects emerging."
  ];
}; 