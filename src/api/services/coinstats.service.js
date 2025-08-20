import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

/**
 * CoinStats API Service via Microservice
 * Full-featured crypto data with API key secured in microservice
 */

export const coinstatsService = {
  // Get coin prices and market data
  async getCoins(limit = 10, page = 1) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/coins?page=${page}&limit=${limit}&currency=USD`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('CoinStats coins fetch error:', error);
      throw error;
    }
  },

  // Get specific coin data
  async getCoin(coinId) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/coins/${coinId}?currency=USD`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('CoinStats coin fetch error:', error);
      throw error;
    }
  },

  // Get market data overview
  async getMarkets(limit = 50) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/markets?limit=${limit}&currency=USD&sortBy=rank`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('CoinStats markets fetch error:', error);
      throw error;
    }
  },

  // Get specific coin by ID
  async searchCoins(query) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/search?query=${encodeURIComponent(query)}&currency=USD`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('CoinStats coin fetch error:', error);
      throw error;
    }
  },

  // Get portfolio insights
  async getPortfolioInsights() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/portfolio-insights?limit=5&sortBy=marketCap`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('CoinStats portfolio insights error:', error);
      throw error;
    }
  }
};