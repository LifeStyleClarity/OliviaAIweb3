import axios from 'axios';
import CryptoJS from 'crypto-js';

// OKX DEX API Configuration
const OKX_DEX_BASE_URL = 'https://www.okx.com/api/v5/dex/aggregator';
const API_KEY = '01cf4db1-160f-4baf-aa33-ca92ee7d1e01';
const SECRET_KEY = 'B326A560DF0D8AA0AE8AAE7A42082676';
const PASSPHRASE = 'Olivia2025!'; // You may need to set this in OKX dashboard

class OKXDexService {
  constructor() {
    this.baseURL = OKX_DEX_BASE_URL;
    this.apiKey = API_KEY;
    this.secretKey = SECRET_KEY;
    this.passphrase = PASSPHRASE;
  }

  /**
   * Generate authentication signature for OKX API
   */
  generateSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, this.secretKey));
  }

  /**
   * Create authenticated headers for OKX API requests
   */
  createHeaders(method, requestPath, body = '') {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(timestamp, method, requestPath, body);

    return {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get supported chains/networks
   */
  async getSupportedChains() {
    try {
      const requestPath = '/supported/chain';
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🔗 OKX: Supported chains fetched', response.data);
      return {
        success: true,
        chains: response.data.data || []
      };
    } catch (error) {
      console.error('🔗 OKX: Failed to fetch supported chains:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message
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
      const requestPath = `/quote?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('💱 OKX: Quote fetched', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount,
        quote: response.data.data
      });

      return {
        success: true,
        quote: response.data.data
      };
    } catch (error) {
      console.error('💱 OKX: Failed to fetch quote:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message
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
      const requestPath = `/swap?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&userWalletAddress=${userWalletAddress}&slippage=${slippage}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🔄 OKX: Swap data generated', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount,
        userWallet: userWalletAddress
      });

      return {
        success: true,
        swapData: response.data.data
      };
    } catch (error) {
      console.error('🔄 OKX: Failed to generate swap data:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message
      };
    }
  }

  /**
   * Get token list for a specific chain
   * @param {string} chainId - Chain ID
   */
  async getTokens(chainId) {
    try {
      const requestPath = `/tokens?chainId=${chainId}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🪙 OKX: Tokens fetched for chain', chainId);
      return {
        success: true,
        tokens: response.data.data || []
      };
    } catch (error) {
      console.error('🪙 OKX: Failed to fetch tokens:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message
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
   * Get popular trading pairs for quick access
   */
  async getPopularPairs(chainId = '1') {
    // Common token addresses (Ethereum mainnet)
    const popularTokens = {
      '1': { // Ethereum
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'USDC': '0xA0b86a33E6441d41Bce2C2c8d6c4e7c14e8c2b8',
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      }
    };

    return {
      success: true,
      pairs: popularTokens[chainId] || {}
    };
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
      console.log('🤖 Olivia: Getting quote for', { fromToken, toToken, amount, chainId });
      
      // Get token addresses (this would need to be expanded with a proper token registry)
      const tokenPairs = await this.getPopularPairs(chainId);
      const fromTokenAddress = tokenPairs.pairs[fromToken.toUpperCase()];
      const toTokenAddress = tokenPairs.pairs[toToken.toUpperCase()];

      if (!fromTokenAddress || !toTokenAddress) {
        return {
          success: false,
          oliviaMessage: `Hold up! I don't recognize one of those tokens. Try something popular like USDT, USDC, or WETH. 🤔`,
          error: 'Token not found in registry'
        };
      }

      // Format amount (assuming 18 decimals for now - this should be dynamic)
      const formattedAmount = this.formatTokenAmount(amount, 18);
      
      const quote = await this.getQuote(chainId, fromTokenAddress, toTokenAddress, formattedAmount);

      if (quote.success) {
        const outputAmount = this.parseTokenAmount(quote.quote.toTokenAmount, 18);
        const rate = (parseFloat(outputAmount) / amount).toFixed(6);
        
        return {
          success: true,
          quote: quote.quote,
          oliviaMessage: `Alright, I found you a sweet deal! ${amount} ${fromToken} gets you ${outputAmount} ${toToken} - that's a rate of ${rate}. Want me to execute this trade? 😏`,
          details: {
            fromAmount: amount,
            fromToken,
            toAmount: outputAmount,
            toToken,
            rate,
            gasEstimate: quote.quote.estimatedGas
          }
        };
      } else {
        // Check if it's a geo-blocking error
        if (quote.error && quote.error.includes('local regulations')) {
          return {
            success: false,
            oliviaMessage: `Ugh, looks like OKX is geo-blocked in your area. Those pesky regulations are cramping my style! 🙄 I need to set up a different DEX aggregator for your region. Give me a sec to work on that... 🔧`,
            error: 'geo_blocked'
          };
        }
        
        return {
          success: false,
          oliviaMessage: `Ugh, something went wrong getting that quote. The DEX gods aren't cooperating right now. Try again in a sec? 🙄`,
          error: quote.error
        };
      }
    } catch (error) {
      console.error('🤖 Olivia: Quote error:', error);
      return {
        success: false,
        oliviaMessage: `Oops, I hit a snag getting that quote. My bad! Try again with different tokens? 🤷‍♀️`,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const okxDexService = new OKXDexService();
export default okxDexService;
