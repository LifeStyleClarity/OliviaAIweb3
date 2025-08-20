import express from 'express';
import { OpenAIController } from '../controllers/openaiController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/cors.js';
import { createOpenAIRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply OpenAI specific rate limiting
const openaiRateLimit = createOpenAIRateLimiter();

/**
 * POST /api/openai/chat/completions
 * Generate chat completion using OpenAI
 */
router.post('/chat/completions', 
  openaiRateLimit,
  authenticateAdmin,
  validateOrigin,
  OpenAIController.generateChatCompletion
);

/**
 * POST /api/openai/extract-trading
 * Extract trading parameters from natural language input
 */
router.post('/extract-trading',
  openaiRateLimit,
  authenticateAdmin,
  validateOrigin,
  OpenAIController.extractTradingParameters
);

/**
 * GET /api/openai/models
 * Get available OpenAI models
 */
router.get('/models',
  authenticateAdmin,
  validateOrigin,
  OpenAIController.getModels
);

/**
 * GET /api/openai/token-info
 * Get information from the authenticated JWT token
 */
router.get('/token-info',
  authenticateAdmin,
  validateOrigin,
  OpenAIController.getTokenInfo
);

export default router;
