import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

/**
 * Lurky API Service via Microservice
 * Secure API access through microservice with API key protection
 */

export const lurkyService = {
  // Get coin data from Lurky API
  async getCoins(coinSymbol = null) {
    try {
      const params = new URLSearchParams({
        sort_dir: 'desc',
        sentiment: 'bullish',
        min_rank: '1',
        max_rank: '500',
        sort_by: 'mentions',
        page: '0',
        limit: '10'
      });
      
      if (coinSymbol) {
        params.append('coinSymbol', coinSymbol);
      }

      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/lurky/coins?${params}`, {
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
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/lurky/trending`, {
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
      console.error('Lurky trending fetch error:', error);
      throw error;
    }
  },

  // Generic GET helper
  async get(path, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/lurky/generic/${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
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
      console.error('Lurky generic GET error:', error);
      throw error;
    }
  },

  // Generic POST helper
  async post(path, body = {}, config = {}) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/lurky/generic/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin,
          ...config.headers
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('Lurky generic POST error:', error);
      throw error;
    }
  },

  // Generic DELETE helper
  async del(path) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/lurky/generic/${path}`, {
        method: 'DELETE',
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
      console.error('Lurky generic DELETE error:', error);
      throw error;
    }
  }
};