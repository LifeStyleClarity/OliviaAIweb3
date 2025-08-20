import { config } from '../config/config.js';
import { parse } from 'url';

/**
 * WebSocket authentication middleware
 * Validates WebSocket connections before allowing them to connect
 */
export function authenticateWebSocket(request) {
  // Skip authentication in development mode
  if (config.nodeEnv === 'development') {
    console.log('🔓 Development mode: Skipping WebSocket authentication');
    return { success: true, clientId: generateClientId() };
  }

  const url = parse(request.url, true);
  const origin = request.headers.origin;
  
  // Check Origin
  if (origin !== config.allowedOrigin) {
    console.log(`❌ WebSocket connection rejected - Invalid origin: ${origin}`);
    return { 
      success: false, 
      code: 403, 
      message: 'Forbidden: Invalid origin' 
    };
  }

  // Check Authorization Token
  const token = url.query.token || request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ WebSocket connection rejected - No token provided');
    return { 
      success: false, 
      code: 401, 
      message: 'Unauthorized: Token required' 
    };
  }

  if (token !== config.adminAccessSecret) {
    console.log('❌ WebSocket connection rejected - Invalid token');
    return { 
      success: false, 
      code: 403, 
      message: 'Forbidden: Invalid token' 
    };
  }

  // Generate unique client ID
  const clientId = generateClientId();
  console.log(`✅ WebSocket connection authenticated - Client ID: ${clientId}`);
  
  return { success: true, clientId };
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * WebSocket Origin validation
 */
export function validateWebSocketOrigin(origin) {
  if (config.nodeEnv === 'development') {
    return true; // Allow all origins in development
  }
  
  return origin === config.allowedOrigin;
}
