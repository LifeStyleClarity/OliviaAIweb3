import axios from 'axios';
import { config } from '../config/config.js';

// CoinStats API Configuration
const COINSTATS_BASE_URL = 'https://openapiv1.coinstats.app';

// Create axios instance for CoinStats
const coinStatsAxios = axios.create({
  baseURL: COINSTATS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.coinStatsApiKey,
  },
});

// Request interceptor for logging
coinStatsAxios.interceptors.request.use((requestConfig) => {
  if (config.nodeEnv === 'development') {
    console.log('[CoinStats] Request:', {
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      method: requestConfig.method,
    });
  }
  return requestConfig;
});

// Response interceptor for logging
coinStatsAxios.interceptors.response.use(
  (response) => {
    if (config.nodeEnv === 'development') {
      console.log('[CoinStats] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (config.nodeEnv === 'development') {
      console.error('[CoinStats] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

/**
 * CoinStats Controller class
 */
export class CoinStatsController {
  
  /**
   * Get coin prices and market data
   */
  static async getCoins(req, res) {
    try {
      const { limit = 10, page = 1, currency = 'USD' } = req.query;
      
      const response = await coinStatsAxios.get('/coins', {
        params: {
          page: parseInt(page),
          limit: parseInt(limit),
          currency
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getCoins error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch coins',
        code: 'COINSTATS_COINS_ERROR'
      });
    }
  }

  /**
   * Get specific coin data
   */
  static async getCoin(req, res) {
    try {
      const { coinId } = req.params;
      const { currency = 'USD' } = req.query;

      if (!coinId) {
        return res.status(400).json({
          success: false,
          error: 'Coin ID is required',
          code: 'MISSING_COIN_ID'
        });
      }

      const response = await coinStatsAxios.get(`/coins/${coinId}`, {
        params: { currency }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getCoin error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch coin data',
        code: 'COINSTATS_COIN_ERROR'
      });
    }
  }

  /**
   * Get market data overview
   */
  static async getMarkets(req, res) {
    try {
      const { limit = 50, currency = 'USD', sortBy = 'rank' } = req.query;

      const response = await coinStatsAxios.get('/coins', {
        params: {
          limit: parseInt(limit),
          currency,
          sortBy
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getMarkets error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch market data',
        code: 'COINSTATS_MARKETS_ERROR'
      });
    }
  }

  /**
   * Search for coins by query
   */
  static async searchCoins(req, res) {
    try {
      const { query, currency = 'USD' } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          code: 'MISSING_QUERY'
        });
      }

      // Map common names/symbols to CoinStats IDs
      const coinMapping = {
        'bitcoin': 'bitcoin',
        'btc': 'bitcoin',
        'ethereum': 'ethereum', 
        'eth': 'ethereum',
        'solana': 'solana',
        'sol': 'solana',
        'cardano': 'cardano',
        'ada': 'cardano',
        'polkadot': 'polkadot',
        'dot': 'polkadot',
        'chainlink': 'chainlink',
        'link': 'chainlink',
        'polygon': 'polygon',
        'matic': 'polygon',
        'avalanche': 'avalanche-2',
        'avax': 'avalanche-2',
        'dogecoin': 'dogecoin',
        'doge': 'dogecoin',
        'shiba': 'shiba-inu',
        'shib': 'shiba-inu',
        'ripple': 'ripple',
        'xrp': 'ripple',
        'binance': 'binancecoin',
        'bnb': 'binancecoin',
        'tron': 'tron',
        'trx': 'tron',
        'uniswap': 'uniswap',
        'uni': 'uniswap',
        'cosmos': 'cosmos',
        'atom': 'cosmos',
        'near': 'near',
        'algorand': 'algorand',
        'algo': 'algorand',
        'fantom': 'fantom',
        'ftm': 'fantom',
        'aave': 'aave',
        'terra': 'terra-luna',
        'luna': 'terra-luna',
        // Popular meme coins and newer tokens
        'popcat': 'popcat',
        'bonk': 'bonk',
        'pepe': 'pepe',
        'floki': 'floki-inu',
        'babydoge': 'baby-doge-coin',
        'safemoon': 'safemoon',
        'wojak': 'wojak',
        'chad': 'chad',
        'mog': 'mog-coin',
        'brett': 'brett',
        'wif': 'dogwifhat',
        'myro': 'myro',
        'wen': 'wen',
        'jup': 'jupiter',
        'jupiter': 'jupiter',
        'render': 'render-token',
        'rndr': 'render-token',
        'kaspa': 'kaspa',
        'kas': 'kaspa',
        'injective': 'injective-protocol',
        'inj': 'injective-protocol',
        'sei': 'sei-network',
        'tia': 'celestia',
        'celestia': 'celestia',
        'wld': 'worldcoin-wld',
        'worldcoin': 'worldcoin-wld',
        'arb': 'arbitrum',
        'arbitrum': 'arbitrum',
        'op': 'optimism',
        'optimism': 'optimism',
        'blur': 'blur',
        'ldo': 'lido-dao',
        'lido': 'lido-dao',
        'rpl': 'rocket-pool',
        'rocketpool': 'rocket-pool',
        // Missing trending coins from AI mentions
        'cfx': 'conflux-token',
        'conflux': 'conflux-token',
        'pudgy': 'pudgy-penguins',
        'pengu': 'pudgy-penguins',
        'penguins': 'pudgy-penguins',
        'ethena': 'ethena',
        'ena': 'ethena',
        'curve': 'curve-dao-token',
        'crv': 'curve-dao-token',
        'dao': 'curve-dao-token',
        'omikami': 'omikami',
        'rize': 'rize',
        // Internet Computer
        'icp': 'internet-computer',
        'internet-computer': 'internet-computer',
        'dfinity': 'internet-computer'
      };
      
      const coinId = coinMapping[query.toLowerCase()] || query.toLowerCase();
      
      const response = await coinStatsAxios.get(`/coins/${coinId}`, {
        params: { currency }
      });
      
      // Return in expected format
      const data = {
        result: [response.data.coin || response.data]
      };

      res.json({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats searchCoins error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search coins',
        code: 'COINSTATS_SEARCH_ERROR'
      });
    }
  }

  /**
   * Get portfolio insights
   */
  static async getPortfolioInsights(req, res) {
    try {
      const { limit = 5, sortBy = 'marketCap' } = req.query;

      const response = await coinStatsAxios.get('/coins', {
        params: {
          limit: parseInt(limit),
          sortBy
        }
      });

      const topCoins = response.data.result || response.data;
      const totalMarketCap = topCoins.reduce((sum, coin) => sum + (coin.marketCap || 0), 0);

      const insights = {
        topCoins,
        totalMarketCap
      };

      res.json({
        success: true,
        data: insights,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getPortfolioInsights error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get portfolio insights',
        code: 'COINSTATS_PORTFOLIO_ERROR'
      });
    }
  }
}
