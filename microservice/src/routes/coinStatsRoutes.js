import express from 'express';
import { CoinStatsController } from '../controllers/coinStatsController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting for CoinStats routes
const coinStatsRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs (higher for crypto data)
  message: {
    error: 'Too many CoinStats requests',
    code: 'COINSTATS_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * GET /api/coinstats/coins
 * Get coin prices and market data
 * Query params: limit, page, currency
 */
router.get('/coins', 
  coinStatsRateLimit,
  authenticateAdmin,
  validateOrigin,
  CoinStatsController.getCoins
);

/**
 * GET /api/coinstats/coins/:coinId
 * Get specific coin data
 * Params: coinId
 * Query params: currency
 */
router.get('/coins/:coinId',
  coinStatsRateLimit,
  authenticateAdmin,
  validateOrigin,
  CoinStatsController.getCoin
);

/**
 * GET /api/coinstats/markets
 * Get market data overview
 * Query params: limit, currency, sortBy
 */
router.get('/markets',
  coinStatsRateLimit,
  authenticateAdmin,
  validateOrigin,
  CoinStatsController.getMarkets
);

/**
 * GET /api/coinstats/search
 * Search for coins by query
 * Query params: query, currency
 */
router.get('/search',
  coinStatsRateLimit,
  authenticateAdmin,
  validateOrigin,
  CoinStatsController.searchCoins
);

/**
 * GET /api/coinstats/portfolio-insights
 * Get portfolio insights
 * Query params: limit, sortBy
 */
router.get('/portfolio-insights',
  coinStatsRateLimit,
  authenticateAdmin,
  validateOrigin,
  CoinStatsController.getPortfolioInsights
);

export default router;
