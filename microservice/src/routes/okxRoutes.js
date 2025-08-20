import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { okxController } from '../controllers/okxController.js';

const router = express.Router();

/**
 * OKX DEX Aggregator Routes
 * All routes require authentication and origin validation
 */

// Middleware for all OKX routes
router.use(authenticateAdmin);
router.use(validateOrigin);

/**
 * GET /api/okx/chains
 * Get supported blockchain networks
 * 
 * Response:
 * {
 *   "success": true,
 *   "chains": [
 *     {
 *       "chainId": "1",
 *       "chainName": "Ethereum",
 *       "nativeCurrency": { ... }
 *     }
 *   ]
 * }
 */
router.get('/chains', async (req, res) => {
  try {
    await okxController.getSupportedChains(req, res);
  } catch (error) {
    console.error('🔗 OKX Route Error (chains):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/okx/quote
 * Get swap quote for token pair
 * 
 * Query Parameters:
 * - chainId: Blockchain network ID (required)
 * - fromTokenAddress: Source token contract address (required)
 * - toTokenAddress: Destination token contract address (required)
 * - amount: Amount to swap in smallest unit (required)
 * - slippage: Slippage tolerance in % (optional, default: 0.5)
 * 
 * Example: /api/okx/quote?chainId=1&fromTokenAddress=0x...&toTokenAddress=0x...&amount=1000000
 * 
 * Response:
 * {
 *   "success": true,
 *   "quote": {
 *     "toTokenAmount": "998500",
 *     "estimatedGas": "150000",
 *     "dexRouterAddress": "0x...",
 *     "priceImpact": "0.15"
 *   }
 * }
 */
router.get('/quote', async (req, res) => {
  try {
    await okxController.getQuote(req, res);
  } catch (error) {
    console.error('💱 OKX Route Error (quote):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/okx/swap
 * Get swap transaction data
 * 
 * Query Parameters:
 * - chainId: Blockchain network ID (required)
 * - fromTokenAddress: Source token contract address (required)
 * - toTokenAddress: Destination token contract address (required)
 * - amount: Amount to swap in smallest unit (required)
 * - userWalletAddress: User's wallet address (required)
 * - slippage: Slippage tolerance in % (optional, default: 0.5)
 * 
 * Example: /api/okx/swap?chainId=1&fromTokenAddress=0x...&toTokenAddress=0x...&amount=1000000&userWalletAddress=0x...
 * 
 * Response:
 * {
 *   "success": true,
 *   "swapData": {
 *     "data": "0x...",
 *     "to": "0x...",
 *     "value": "0",
 *     "gasLimit": "150000"
 *   }
 * }
 */
router.get('/swap', async (req, res) => {
  try {
    await okxController.getSwapData(req, res);
  } catch (error) {
    console.error('🔄 OKX Route Error (swap):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/okx/tokens
 * Get token list for a specific blockchain
 * 
 * Query Parameters:
 * - chainId: Blockchain network ID (required)
 * 
 * Example: /api/okx/tokens?chainId=1
 * 
 * Response:
 * {
 *   "success": true,
 *   "tokens": [
 *     {
 *       "tokenContractAddress": "0x...",
 *       "tokenSymbol": "USDT",
 *       "tokenName": "Tether USD",
 *       "decimals": 6
 *     }
 *   ]
 * }
 */
router.get('/tokens', async (req, res) => {
  try {
    await okxController.getTokens(req, res);
  } catch (error) {
    console.error('🪙 OKX Route Error (tokens):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/okx/popular-pairs
 * Get popular trading pairs for quick access
 * 
 * Query Parameters:
 * - chainId: Blockchain network ID (optional, default: "1")
 * 
 * Example: /api/okx/popular-pairs?chainId=1
 * 
 * Response:
 * {
 *   "success": true,
 *   "pairs": {
 *     "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
 *     "USDC": "0xA0b86a33E6441d41Bce2C2c8d6c4e7c14e8c2b8",
 *     "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *   }
 * }
 */
router.get('/popular-pairs', async (req, res) => {
  try {
    await okxController.getPopularPairs(req, res);
  } catch (error) {
    console.error('🔗 OKX Route Error (popular-pairs):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/okx/olivia-quote
 * Get Olivia AI-powered quote with personality
 * 
 * Request Body:
 * {
 *   "fromToken": "USDT",
 *   "toToken": "USDC", 
 *   "amount": 100,
 *   "chainId": "1"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "quote": { ... },
 *   "oliviaMessage": "Alright, I found you a sweet deal! ...",
 *   "details": {
 *     "fromAmount": 100,
 *     "fromToken": "USDT",
 *     "toAmount": "99.85",
 *     "toToken": "USDC",
 *     "rate": "0.998500",
 *     "gasEstimate": "150000"
 *   }
 * }
 */
router.post('/olivia-quote', async (req, res) => {
  try {
    await okxController.getOliviaQuote(req, res);
  } catch (error) {
    console.error('🤖 OKX Route Error (olivia-quote):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
