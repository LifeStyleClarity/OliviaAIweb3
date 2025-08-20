import express from 'express';
import { ChangeNowController } from '../controllers/changeNowController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting for ChangeNOW routes
const changeNowRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many ChangeNOW requests',
    code: 'CHANGENOW_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * GET /api/changenow/currencies
 * Get list of available currencies
 */
router.get('/currencies', 
  changeNowRateLimit,
  authenticateAdmin,
  validateOrigin,
  ChangeNowController.getCurrencies
);

/**
 * GET /api/changenow/exchange-amount
 * Get exchange amount estimate
 * Query params: from, to, amount
 */
router.get('/exchange-amount',
  changeNowRateLimit,
  authenticateAdmin,
  validateOrigin,
  ChangeNowController.getExchangeAmount
);

/**
 * GET /api/changenow/min-amount
 * Get minimum exchange amount
 * Query params: from, to
 */
router.get('/min-amount',
  changeNowRateLimit,
  authenticateAdmin,
  validateOrigin,
  ChangeNowController.getMinAmount
);

/**
 * GET /api/changenow/exchange-rate
 * Get exchange rate for currency pair
 * Query params: from, to
 */
router.get('/exchange-rate',
  changeNowRateLimit,
  authenticateAdmin,
  validateOrigin,
  ChangeNowController.getExchangeRate
);

/**
 * POST /api/changenow/transactions
 * Create new exchange transaction
 * Body: { from, to, amount, address, extraId?, refundAddress? }
 */
router.post('/transactions',
  changeNowRateLimit,
  authenticateAdmin,
  validateOrigin,
  ChangeNowController.createTransaction
);

/**
 * GET /api/changenow/transactions/:id
 * Get transaction status by ID
 */
router.get('/transactions/:id',
  changeNowRateLimit,
  authenticateAdmin,
  validateOrigin,
  ChangeNowController.getTransactionStatus
);

export default router;
