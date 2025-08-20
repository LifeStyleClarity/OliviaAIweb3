import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

/**
 * Authentication middleware to verify JWT admin access token
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

  // Extract token from "Bearer token"
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization header must start with "Bearer "',
      code: 'INVALID_AUTH_FORMAT'
    });
  }

  const token = authHeader.slice(7);

  try {
    // Verify and decode the JWT token using ADMIN_ACCESS_SECRET
    const decoded = jwt.verify(token, config.adminAccessSecret);
    
    // Attach decoded token information to request object
    req.tokenInfo = {
      client_id: decoded.client_id,
      role: decoded.role,
      account_type: decoded.account_type,
      account_status: decoded.account_status,
      company_name: decoded.company_name,
      token_type: decoded.token_type,
      issued_at: decoded.issued_at,
      no_expiration: decoded.no_expiration
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else {
      return res.status(403).json({
        error: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  }
};
