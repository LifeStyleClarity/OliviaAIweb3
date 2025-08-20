import axios from 'axios';
import { ENDPOINTS } from '../config/endpoints.js';
import { log, error as logError } from '../../utils/logger.js';

/**
 * OKX DEX Service - Frontend Interface
 * Routes all requests through secure microservice to protect API credentials
 */
class OKXDexService {
  constructor() {
    this.microserviceURL = ENDPOINTS.OPENAI_MICROSERVICE.BASE_URL;
    this.token = import.meta.env.VITE_APP_ACCESS_TOKEN;
    
    // Create axios instance for microservice calls
    this.axiosInstance = axios.create({
      baseURL: this.microserviceURL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get supported chains/networks
   */
  async getSupportedChains() {
    try {
      const response = await this.axiosInstance.get('/api/okx/chains');
      
      log('🔗 OKX: Supported chains fetched', response.data);
      
      return response.data;
    } catch (error) {
      logError('🔗 OKX: Failed to fetch supported chains:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get quote for token swap
   * @param {string} chainId - Chain ID (e.g., '1' for Ethereum, '56' for BSC)
   * @param {string} fromTokenAddress - Source token contract address
   * @param {string} toTokenAddress - Destination token contract address
   * @param {string} amount - Amount to swap (in token's smallest unit)
   * @param {number} slippage - Slippage tolerance (e.g., 0.5 for 0.5%)
   */
  async getQuote(chainId, fromTokenAddress, toTokenAddress, amount, slippage = 0.5) {
    try {
      const response = await this.axiosInstance.get('/api/okx/quote', {
        params: {
          chainId,
          fromTokenAddress,
          toTokenAddress,
          amount,
          slippage
        }
      });
      
      log('💱 OKX: Quote fetched', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount,
        quote: response.data.quote
      });

      return response.data;
    } catch (error) {
      logError('💱 OKX: Failed to fetch quote:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get swap transaction data
   * @param {string} chainId - Chain ID
   * @param {string} fromTokenAddress - Source token contract address
   * @param {string} toTokenAddress - Destination token contract address
   * @param {string} amount - Amount to swap
   * @param {string} userWalletAddress - User's wallet address
   * @param {number} slippage - Slippage tolerance
   */
  async getSwapData(chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress, slippage = 0.5) {
    try {
      const response = await this.axiosInstance.get('/api/okx/swap', {
        params: {
          chainId,
          fromTokenAddress,
          toTokenAddress,
          amount,
          userWalletAddress,
          slippage
        }
      });
      
      log('🔄 OKX: Swap data generated', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount,
        userWallet: userWalletAddress
      });

      return response.data;
    } catch (error) {
      logError('🔄 OKX: Failed to generate swap data:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get token list for a specific chain
   * @param {string} chainId - Chain ID
   */
  async getTokens(chainId) {
    try {
      const response = await this.axiosInstance.get('/api/okx/tokens', {
        params: { chainId }
      });
      
      log('🪙 OKX: Tokens fetched for chain', chainId);
      
      return response.data;
    } catch (error) {
      logError('🪙 OKX: Failed to fetch tokens:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get popular trading pairs for quick access
   * @param {string} chainId - Chain ID (default: '1')
   */
  async getPopularPairs(chainId = '1') {
    try {
      const response = await this.axiosInstance.get('/api/okx/popular-pairs', {
        params: { chainId }
      });
      
      return response.data;
    } catch (error) {
      logError('🔗 OKX: Failed to get popular pairs:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Helper: Format token amount from human readable to contract units
   * @param {string|number} amount - Human readable amount
   * @param {number} decimals - Token decimals
   */
  formatTokenAmount(amount, decimals) {
    const amountBN = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(amountBN).toString();
  }

  /**
   * Helper: Format token amount from contract units to human readable
   * @param {string} amount - Contract units amount
   * @param {number} decimals - Token decimals
   */
  parseTokenAmount(amount, decimals) {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
  }

  /**
   * Olivia AI Integration: Get best quote with personality
   * @param {string} fromToken - Source token symbol
   * @param {string} toToken - Destination token symbol
   * @param {number} amount - Amount to swap
   * @param {string} chainId - Chain ID (default Ethereum)
   */
  async getOliviaQuote(fromToken, toToken, amount, chainId = '1') {
    try {
      const response = await this.axiosInstance.post('/api/okx/olivia-quote', {
        fromToken,
        toToken,
        amount,
        chainId
      });
      
      log('🤖 Olivia: Quote response:', response.data);
      
      return response.data;
    } catch (error) {
      logError('🤖 Olivia: Quote error:', error.response?.data || error.message);
      
      // Return user-friendly error message from Olivia
      return {
        success: false,
        oliviaMessage: `Oops, I hit a snag getting that quote. My bad! Try again with different tokens? 🤷‍♀️`,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

// Export singleton instance
export const okxDexService = new OKXDexService();
export default okxDexService;