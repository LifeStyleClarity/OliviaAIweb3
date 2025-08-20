import axios from 'axios';
import CryptoJS from 'crypto-js';
import { config } from '../config/config.js';

/**
 * OKX DEX Controller
 * Handles OKX DEX aggregator API calls with secure credentials
 */
class OKXController {
  constructor() {
    this.baseURL = config.okxDexBaseUrl;
    this.apiKey = config.okxApiKey;
    this.secretKey = config.okxSecretKey;
    this.passphrase = config.okxPassphrase;
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
   * GET /api/okx/chains - Get supported chains/networks
   */
  async getSupportedChains(req, res) {
    try {
      const requestPath = '/supported/chain';
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🔗 OKX: Supported chains fetched');
      res.json({
        success: true,
        chains: response.data.data || []
      });
    } catch (error) {
      console.error('🔗 OKX: Failed to fetch supported chains:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/quote - Get quote for token swap
   * Query params: chainId, fromTokenAddress, toTokenAddress, amount, slippage (optional)
   */
  async getQuote(req, res) {
    try {
      const { chainId, fromTokenAddress, toTokenAddress, amount, slippage = 0.5 } = req.query;
      
      if (!chainId || !fromTokenAddress || !toTokenAddress || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: chainId, fromTokenAddress, toTokenAddress, amount'
        });
      }

      const requestPath = `/quote?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('💱 OKX: Quote fetched', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount
      });

      res.json({
        success: true,
        quote: response.data.data
      });
    } catch (error) {
      console.error('💱 OKX: Failed to fetch quote:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/swap - Get swap transaction data
   * Query params: chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress, slippage (optional)
   */
  async getSwapData(req, res) {
    try {
      const { chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress, slippage = 0.5 } = req.query;
      
      if (!chainId || !fromTokenAddress || !toTokenAddress || !amount || !userWalletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: chainId, fromTokenAddress, toTokenAddress, amount, userWalletAddress'
        });
      }

      const requestPath = `/swap?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&userWalletAddress=${userWalletAddress}&slippage=${slippage}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🔄 OKX: Swap data generated', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount,
        userWallet: userWalletAddress
      });

      res.json({
        success: true,
        swapData: response.data.data
      });
    } catch (error) {
      console.error('🔄 OKX: Failed to generate swap data:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/tokens - Get token list for a specific chain
   * Query params: chainId
   */
  async getTokens(req, res) {
    try {
      const { chainId } = req.query;
      
      if (!chainId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: chainId'
        });
      }

      const requestPath = `/tokens?chainId=${chainId}`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      
      console.log('🪙 OKX: Tokens fetched for chain', chainId);
      res.json({
        success: true,
        tokens: response.data.data || []
      });
    } catch (error) {
      console.error('🪙 OKX: Failed to fetch tokens:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * GET /api/okx/popular-pairs - Get popular trading pairs for quick access
   * Query params: chainId (optional, defaults to '1')
   */
  async getPopularPairs(req, res) {
    try {
      const { chainId = '1' } = req.query;
      
      // Common token addresses (Ethereum mainnet)
      const popularTokens = {
        '1': { // Ethereum
          'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          'USDC': '0xA0b86a33E6441d41Bce2C2c8d6c4e7c14e8c2b8',
          'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        }
      };

      res.json({
        success: true,
        pairs: popularTokens[chainId] || {}
      });
    } catch (error) {
      console.error('🔗 OKX: Failed to get popular pairs:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/okx/olivia-quote - Olivia AI Integration: Get best quote with personality
   * Body: { fromToken, toToken, amount, chainId (optional) }
   */
  async getOliviaQuote(req, res) {
    try {
      const { fromToken, toToken, amount, chainId = '1' } = req.body;
      
      if (!fromToken || !toToken || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: fromToken, toToken, amount'
        });
      }

      console.log('🤖 Olivia: Getting quote for', { fromToken, toToken, amount, chainId });
      
      // Get token addresses (this would need to be expanded with a proper token registry)
      const popularPairsResponse = await this.getPopularPairs({ query: { chainId } }, { json: (data) => data });
      const tokenPairs = popularPairsResponse;
      const fromTokenAddress = tokenPairs.pairs[fromToken.toUpperCase()];
      const toTokenAddress = tokenPairs.pairs[toToken.toUpperCase()];

      if (!fromTokenAddress || !toTokenAddress) {
        return res.json({
          success: false,
          oliviaMessage: `Hold up! I don't recognize one of those tokens. Try something popular like USDT, USDC, or WETH. 🤔`,
          error: 'Token not found in registry'
        });
      }

      // Format amount (assuming 18 decimals for now - this should be dynamic)
      const formattedAmount = this.formatTokenAmount(amount, 18);
      
      const requestPath = `/quote?chainId=${chainId}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${formattedAmount}&slippage=0.5`;
      const headers = this.createHeaders('GET', requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, { headers });
      const quote = response.data.data;

      const outputAmount = this.parseTokenAmount(quote.toTokenAmount, 18);
      const rate = (parseFloat(outputAmount) / amount).toFixed(6);
      
      res.json({
        success: true,
        quote,
        oliviaMessage: `Alright, I found you a sweet deal! ${amount} ${fromToken} gets you ${outputAmount} ${toToken} - that's a rate of ${rate}. Want me to execute this trade? 😏`,
        details: {
          fromAmount: amount,
          fromToken,
          toAmount: outputAmount,
          toToken,
          rate,
          gasEstimate: quote.estimatedGas
        }
      });
    } catch (error) {
      console.error('🤖 Olivia: Quote error:', error);
      
      // Check if it's a geo-blocking error
      if (error.response?.data?.msg && error.response.data.msg.includes('local regulations')) {
        return res.json({
          success: false,
          oliviaMessage: `Ugh, looks like OKX is geo-blocked in your area. Those pesky regulations are cramping my style! 🙄 I need to set up a different DEX aggregator for your region. Give me a sec to work on that... 🔧`,
          error: 'geo_blocked'
        });
      }
      
      res.json({
        success: false,
        oliviaMessage: `Ugh, something went wrong getting that quote. The DEX gods aren't cooperating right now. Try again in a sec? 🙄`,
        error: error.response?.data?.msg || error.message
      });
    }
  }

  /**
   * Helper: Format token amount from human readable to contract units
   */
  formatTokenAmount(amount, decimals) {
    const amountBN = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(amountBN).toString();
  }

  /**
   * Helper: Format token amount from contract units to human readable
   */
  parseTokenAmount(amount, decimals) {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
  }
}

export const okxController = new OKXController();
