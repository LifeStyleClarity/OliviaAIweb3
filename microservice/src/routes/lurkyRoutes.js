import express from 'express';
import { LurkyController } from '../controllers/lurkyController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting for Lurky routes (stricter due to potential rate limits)
const lurkyRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs (conservative for Lurky)
  message: {
    error: 'Too many Lurky requests',
    code: 'LURKY_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * GET /api/lurky/coins
 * Get coin data from Lurky API
 * Query params: coinSymbol, sort_dir, sentiment, min_rank, max_rank, sort_by, page, limit, spaceId
 */
router.get('/coins', 
  lurkyRateLimit,
  authenticateAdmin,
  validateOrigin,
  LurkyController.getCoins
);

/**
 * GET /api/lurky/trending
 * Get trending data (alias for getCoins with trending parameters)
 * Query params: limit
 */
router.get('/trending',
  lurkyRateLimit,
  authenticateAdmin,
  validateOrigin,
  LurkyController.getTrending
);

/**
 * GET /api/lurky/generic/*
 * Generic GET helper for any Lurky API endpoint
 * Params: path (the API path after the base URL)
 * Query params: any query parameters for the endpoint
 */
router.get('/generic/*',
  lurkyRateLimit,
  authenticateAdmin,
  validateOrigin,
  (req, res) => {
    // Extract the path from the wildcard
    req.params.path = req.params[0];
    LurkyController.getGeneric(req, res);
  }
);

/**
 * POST /api/lurky/generic/*
 * Generic POST helper for any Lurky API endpoint
 * Params: path (the API path after the base URL)
 * Body: any data to post to the endpoint
 */
router.post('/generic/*',
  lurkyRateLimit,
  authenticateAdmin,
  validateOrigin,
  (req, res) => {
    // Extract the path from the wildcard
    req.params.path = req.params[0];
    LurkyController.postGeneric(req, res);
  }
);

/**
 * DELETE /api/lurky/generic/*
 * Generic DELETE helper for any Lurky API endpoint
 * Params: path (the API path after the base URL)
 */
router.delete('/generic/*',
  lurkyRateLimit,
  authenticateAdmin,
  validateOrigin,
  (req, res) => {
    // Extract the path from the wildcard
    req.params.path = req.params[0];
    LurkyController.deleteGeneric(req, res);
  }
);

export default router;
