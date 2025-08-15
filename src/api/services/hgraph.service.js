import axiosHgraph from '../config/axios-hgraph.js';

export const hgraphService = {
  /**
   * Get Hedera network information
   * @returns {Promise} API response with network stats
   */
  async getNetworkInfo() {
    try {
      const { data } = await axiosHgraph.get('/network/supply');
      console.log('🟢 Hedera Mirror Node network info:', data);
      return data;
    } catch (error) {
      console.error('🔴 Hedera Mirror Node getNetworkInfo error:', error);
      throw error;
    }
  },

  /**
   * Get recent Hedera transactions
   * @param {number} limit - Number of transactions to fetch (default: 10)
   * @returns {Promise} API response with recent transactions
   */
  async getRecentTransactions(limit = 10) {
    try {
      const { data } = await axiosHgraph.get('/transactions', {
        params: { limit, order: 'desc' }
      });
      console.log('🟢 Hgraph recent transactions:', data);
      return data;
    } catch (error) {
      console.error('🔴 Hgraph getRecentTransactions error:', error);
      throw error;
    }
  },

  /**
   * Get account information
   * @param {string} accountId - Hedera account ID (e.g., '0.0.123456')
   * @returns {Promise} API response with account data
   */
  async getAccount(accountId) {
    try {
      const { data } = await axiosHgraph.get(`/accounts/${accountId}`);
      console.log(`🟢 Hgraph account ${accountId}:`, data);
      return data;
    } catch (error) {
      console.error(`🔴 Hgraph getAccount(${accountId}) error:`, error);
      throw error;
    }
  },

  /**
   * Get Hedera network nodes information
   * @returns {Promise} API response with network nodes
   */
  async getNetworkNodes() {
    try {
      const { data } = await axiosHgraph.get('/network/nodes');
      console.log('🟢 Hedera Mirror Node network nodes:', data);
      return data;
    } catch (error) {
      console.error('🔴 Hedera Mirror Node getNetworkNodes error:', error);
      throw error;
    }
  },

  /**
   * Get HBAR price data (if available through Hgraph)
   * @returns {Promise} API response with HBAR market data
   */
  async getHbarPrice() {
    try {
      // Fallback to CoinGecko for price data since Hgraph focuses on network data
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
      const data = await response.json();
      console.log('🟢 HBAR price data:', data);
      return data['hedera-hashgraph'];
    } catch (error) {
      console.error('🔴 HBAR price error:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive Hedera data for bubble display
   * @returns {Promise} Formatted data for bubble display
   */
  async getHederaOverview() {
    try {
      // Try to get HBAR price first (most reliable)
      const hbarPrice = await this.getHbarPrice().catch(() => null);
      
      // Try to get network info (may fail due to CORS)
      const networkInfo = await this.getNetworkInfo().catch(() => null);
      
      // Try to get recent transactions (may fail due to CORS)
      const recentTxs = await this.getRecentTransactions(5).catch(() => null);

      const result = {
        network: networkInfo,
        transactions: recentTxs,
        price: hbarPrice
      };

      console.log('🟢 Hedera overview (with fallbacks):', result);
      return result;
    } catch (error) {
      console.error('🔴 Hedera getHederaOverview error:', error);
      // Return at least price data if available
      try {
        const hbarPrice = await this.getHbarPrice();
        return { network: null, transactions: null, price: hbarPrice };
      } catch (priceError) {
        throw new Error('Unable to fetch any Hedera data');
      }
    }
  },

  /**
   * Generic GET request
   * @param {string} path - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async get(path, params = {}) {
    try {
      const { data } = await axiosHgraph.get(path, { params });
      return data;
    } catch (error) {
      console.error(`🔴 Hgraph GET ${path} error:`, error);
      throw error;
    }
  }
};
