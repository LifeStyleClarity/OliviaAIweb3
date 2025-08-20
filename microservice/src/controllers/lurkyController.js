import axios from 'axios';
import { config } from '../config/config.js';

// Lurky API Configuration
const LURKY_BASE_URL = config.lurkyApiBaseUrl || 'https://api.lurky.app';

// Create axios instance for Lurky
const lurkyAxios = axios.create({
  baseURL: LURKY_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-lurky-api-key': config.lurkyApiKey
  }
});

// Request interceptor for logging
lurkyAxios.interceptors.request.use((requestConfig) => {
  if (config.nodeEnv === 'development') {
    console.log('[Lurky] Request:', {
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      method: requestConfig.method,
      headers: requestConfig.headers
    });
  }
  return requestConfig;
});

// Response interceptor for logging and rate limit handling
lurkyAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Surface rate limit info if present
    const rateLimit = {
      limit: error?.response?.headers?.['x-ratelimit-limit'],
      remaining: error?.response?.headers?.['x-ratelimit-remaining'],
      reset: error?.response?.headers?.['x-ratelimit-reset']
    };
    if (rateLimit.limit) {
      // Attach metadata for callers to optionally read
      error.rateLimit = rateLimit;
    }
    if (config.nodeEnv === 'development') {
      console.error('[Lurky] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Lurky Controller class
 */
export class LurkyController {
  
  /**
   * Get coin data from Lurky API
   */
  static async getCoins(req, res) {
    try {
      const { 
        coinSymbol = null,
        sort_dir = 'desc',
        sentiment = 'bullish',
        min_rank = 1,
        max_rank = 500,
        sort_by = 'mentions',
        page = 0,
        limit = 10,
        spaceId = '1lDGLzQENrbxm'
      } = req.query;

      const params = {
        sort_dir,
        sentiment,
        min_rank: parseInt(min_rank),
        max_rank: parseInt(max_rank),
        sort_by,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const response = await lurkyAxios.get(`/spaces/${spaceId}/coins`, { params });
      let responseData = response.data;
      
      // If looking for a specific coin, filter the results
      if (coinSymbol) {
        const coin = responseData.coins?.find(c => 
          c.symbol?.toLowerCase() === coinSymbol.toLowerCase() ||
          c.name?.toLowerCase().includes(coinSymbol.toLowerCase())
        );
        if (coin) {
          responseData = { ...responseData, coins: [coin], filtered_for: coinSymbol };
        }
      }

      res.json({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Lurky getCoins error:', error);
      
      if (error?.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: "Coins endpoint not found. Check the space ID or endpoint path.",
          suggestion: "Verify the space ID is correct.",
          code: 'LURKY_ENDPOINT_NOT_FOUND'
        });
      }
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch coin data',
        code: 'LURKY_COINS_ERROR',
        rateLimit: error.rateLimit
      });
    }
  }

  /**
   * Get trending data - alias for getCoins
   */
  static async getTrending(req, res) {
    try {
      // Forward to getCoins with trending parameters
      req.query = {
        ...req.query,
        sort_by: 'mentions',
        sort_dir: 'desc',
        sentiment: 'bullish',
        limit: req.query.limit || 10
      };
      
      return LurkyController.getCoins(req, res);
    } catch (error) {
      console.error('Lurky getTrending error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch trending data',
        code: 'LURKY_TRENDING_ERROR'
      });
    }
  }

  /**
   * Generic GET helper for Lurky API
   */
  static async getGeneric(req, res) {
    try {
      const { path } = req.params;
      const params = req.query;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: 'Path parameter is required',
          code: 'MISSING_PATH'
        });
      }

      const response = await lurkyAxios.get(`/${path}`, { params });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Lurky getGeneric error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch data',
        code: 'LURKY_GENERIC_GET_ERROR',
        rateLimit: error.rateLimit
      });
    }
  }

  /**
   * Generic POST helper for Lurky API
   */
  static async postGeneric(req, res) {
    try {
      const { path } = req.params;
      const body = req.body;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: 'Path parameter is required',
          code: 'MISSING_PATH'
        });
      }

      const response = await lurkyAxios.post(`/${path}`, body);

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Lurky postGeneric error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to post data',
        code: 'LURKY_GENERIC_POST_ERROR',
        rateLimit: error.rateLimit
      });
    }
  }

  /**
   * Generic DELETE helper for Lurky API
   */
  static async deleteGeneric(req, res) {
    try {
      const { path } = req.params;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: 'Path parameter is required',
          code: 'MISSING_PATH'
        });
      }

      const response = await lurkyAxios.delete(`/${path}`);

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Lurky deleteGeneric error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete data',
        code: 'LURKY_GENERIC_DELETE_ERROR',
        rateLimit: error.rateLimit
      });
    }
  }
}
