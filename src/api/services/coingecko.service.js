import axiosCoingecko from '../config/axios-coingecko';

/**
 * CoinGecko API Service
 * Free tier: No API key needed, rate limited
 */

export const coingeckoService = {
  // Get price data for specific coins
  async getPrices(coinIds = ['bitcoin', 'ethereum', 'solana']) {
    try {
      const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds;
      const { data } = await axiosCoingecko.get('/simple/price', {
        params: {
          ids: ids,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true
        }
      });
      return data;
    } catch (error) {
      console.error('CoinGecko price fetch error:', error);
      throw error;
    }
  },

  // Get trending coins
  async getTrending() {
    try {
      const { data } = await axiosCoingecko.get('/search/trending');
      return data;
    } catch (error) {
      console.error('CoinGecko trending fetch error:', error);
      throw error;
    }
  },

  // Search for a coin
  async searchCoin(query) {
    try {
      const { data } = await axiosCoingecko.get('/search', {
        params: { query }
      });
      return data;
    } catch (error) {
      console.error('CoinGecko search error:', error);
      throw error;
    }
  },

  // Get detailed coin info
  async getCoinDetails(coinId) {
    try {
      const { data } = await axiosCoingecko.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });
      return data;
    } catch (error) {
      console.error('CoinGecko coin details error:', error);
      throw error;
    }
  }
};
