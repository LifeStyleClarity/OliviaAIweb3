import cors from 'cors';
import { config } from '../config/config.js';

/**
 * CORS middleware configuration
 * Only allows requests from the configured allowed origin in production
 * Allows all origins in development mode
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In development mode, allow all origins
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (origin === config.allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

/**
 * Custom origin validation middleware for additional security
 * Skips validation in development mode for convenience
 */
export const validateOrigin = (req, res, next) => {
  // Skip origin validation in development mode
  if (config.nodeEnv === 'development') {
    console.log('🌐 Development mode: Skipping origin validation');
    return next();
  }

  const origin = req.get('Origin') || req.get('Referer');
  
  if (origin && !origin.startsWith(config.allowedOrigin)) {
    return res.status(403).json({
      error: 'Origin not allowed',
      code: 'FORBIDDEN_ORIGIN'
    });
  }
  
  next();
};
