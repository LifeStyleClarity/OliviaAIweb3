import { config } from '../config/config.js';

/**
 * Authentication middleware to verify admin access token
 * Skips authentication in development mode for convenience
 */
export const authenticateAdmin = (req, res, next) => {
  // Skip authentication in development mode
  if (config.nodeEnv === 'development') {
    console.log('🔓 Development mode: Skipping authentication');
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authorization header is required',
      code: 'UNAUTHORIZED'
    });
  }

  // Extract token from "Bearer token" or just "token"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (token !== config.adminAccessSecret) {
    return res.status(403).json({
      error: 'Invalid access token',
      code: 'FORBIDDEN'
    });
  }

  next();
};
