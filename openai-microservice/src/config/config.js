import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  adminAccessSecret: process.env.ADMIN_ACCESS_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // WebSocket Proxy Configuration
  websocketPath: process.env.WEBSOCKET_PATH || '/ws/secure-proxy',
  externalWebsocketUrls: process.env.EXTERNAL_WEBSOCKET_URLS ? 
    process.env.EXTERNAL_WEBSOCKET_URLS.split(',') : [
      'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws/agent/stream',
      'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws',
      'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app',
      'ws://localhost:8080/ws/agent/stream'
    ]
};

// Validate required environment variables
if (!config.adminAccessSecret) {
  throw new Error('ADMIN_ACCESS_SECRET is required');
}

if (!config.openaiApiKey) {
  console.warn('Warning: OPENAI_API_KEY is not set. You will need to set this to use OpenAI features.');
}
