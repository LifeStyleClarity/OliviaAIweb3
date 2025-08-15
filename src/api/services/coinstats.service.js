import axiosCoinstats from '../config/axios-coinstats';

/**
 * CoinStats API Service
 * Full-featured crypto data with API key
 */

export const coinstatsService = {
  // Get coin prices and market data
  async getCoins(limit = 10, page = 1) {
    try {
      const { data } = await axiosCoinstats.get('/coins', {
        params: {
          page,
          limit,
          currency: 'USD'
        }
      });
      return data;
    } catch (error) {
      console.error('CoinStats coins fetch error:', error);
      throw error;
    }
  },

  // Get specific coin data
  async getCoin(coinId) {
    try {
      const { data } = await axiosCoinstats.get(`/coins/${coinId}`, {
        params: {
          currency: 'USD'
        }
      });
      return data;
    } catch (error) {
      console.error('CoinStats coin fetch error:', error);
      throw error;
    }
  },

  // Get market data overview
  async getMarkets(limit = 50) {
    try {
      const { data } = await axiosCoinstats.get('/coins', {
        params: {
          limit,
          currency: 'USD',
          sortBy: 'rank'
        }
      });
      return data;
    } catch (error) {
      console.error('CoinStats markets fetch error:', error);
      throw error;
    }
  },

  // Get specific coin by ID
  async searchCoins(query) {
    try {
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
        'rocketpool': 'rocket-pool'
      };
      
      const coinId = coinMapping[query.toLowerCase()] || query.toLowerCase();
      
      const { data } = await axiosCoinstats.get(`/coins/${coinId}`);
      
      // Return in expected format
      return {
        result: [data.coin || data]
      };
    } catch (error) {
      console.error('CoinStats coin fetch error:', error);
      throw error;
    }
  },

  // Get portfolio insights
  async getPortfolioInsights() {
    try {
      // This would require user portfolio data - placeholder for now
      const { data } = await axiosCoinstats.get('/coins', {
        params: {
          limit: 5,
          sortBy: 'marketCap'
        }
      });
      return {
        topCoins: data.result || data,
        totalMarketCap: data.result?.reduce((sum, coin) => sum + (coin.marketCap || 0), 0) || 0
      };
    } catch (error) {
      console.error('CoinStats portfolio insights error:', error);
      throw error;
    }
  }
};