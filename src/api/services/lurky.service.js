import axiosInstanceLurky from '../config/axios-lurky.js';

/**
 * Lurky API Service
 *
 * Add specific endpoint helpers as needed. These are examples you can adapt
 * once you decide which Lurky endpoints you want to call.
 */

export const lurkyService = {
  // Get coin data from Lurky API
  async getCoins(coinSymbol = null) {
    try {
      const params = {
        sort_dir: 'desc',
        sentiment: 'bullish',
        min_rank: 1,
        max_rank: 500,
        sort_by: 'mentions',
        page: 0,
        limit: 10
      };
      
      const { data } = await axiosInstanceLurky.get('/spaces/1lDGLzQENrbxm/coins', { params });
      
      // If looking for a specific coin, filter the results
      if (coinSymbol) {
        const coin = data.coins?.find(c => 
          c.symbol?.toLowerCase() === coinSymbol.toLowerCase() ||
          c.name?.toLowerCase().includes(coinSymbol.toLowerCase())
        );
        if (coin) {
          return { ...data, coins: [coin], filtered_for: coinSymbol };
        }
      }
      
      return data;
    } catch (error) {
      if (error?.response?.status === 404) {
        return {
          message: "Coins endpoint not found. Check the space ID or endpoint path.",
          suggestion: "Verify the space ID 1lDGLzQENrbxm is correct."
        };
      }
      throw error;
    }
  },

  // Get trending data - alias for getCoins
  async getTrending() {
    return this.getCoins();
  },

  // Generic GET helper
  async get(path, params = {}) {
    const { data } = await axiosInstanceLurky.get(path, { params });
    return data;
  },

  // Generic POST helper
  async post(path, body = {}, config = {}) {
    const { data } = await axiosInstanceLurky.post(path, body, config);
    return data;
  },

  // Generic DELETE helper
  async del(path) {
    const { data } = await axiosInstanceLurky.delete(path);
    return data;
  }
};


