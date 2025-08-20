import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  adminAccessSecret: process.env.ADMIN_ACCESS_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  changeNowApiKey: process.env.CHANGENOW_API_KEY,
  coinStatsApiKey: process.env.COINSTATS_API_KEY,
  lurkyApiKey: process.env.LURKY_API_KEY,
  lurkyApiBaseUrl: process.env.LURKY_API_BASE_URL || 'https://api.lurky.app',
  okxApiKey: process.env.OKX_API_KEY,
  okxSecretKey: process.env.OKX_SECRET_KEY,
  okxPassphrase: process.env.OKX_PASSPHRASE,
  okxDexBaseUrl: process.env.OKX_DEX_BASE_URL || 'https://www.okx.com/api/v5/dex/aggregator',
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
  console.warn('⚠️  ADMIN_ACCESS_SECRET is not set. Using default for development.');
}

if (!config.openaiApiKey) {
  console.warn('Warning: OPENAI_API_KEY is not set. You will need to set this to use OpenAI features.');
}

if (!config.changeNowApiKey) {
  console.warn('Warning: CHANGENOW_API_KEY is not set. You will need to set this to use ChangeNOW features.');
}

if (!config.coinStatsApiKey) {
  console.warn('Warning: COINSTATS_API_KEY is not set. You will need to set this to use CoinStats features.');
}

if (!config.lurkyApiKey) {
  console.warn('Warning: LURKY_API_KEY is not set. You will need to set this to use Lurky features.');
}

if (!config.okxApiKey) {
  console.warn('Warning: OKX_API_KEY is not set. You will need to set this to use OKX DEX features.');
}

if (!config.okxSecretKey) {
  console.warn('Warning: OKX_SECRET_KEY is not set. You will need to set this to use OKX DEX features.');
}

if (!config.okxPassphrase) {
  console.warn('Warning: OKX_PASSPHRASE is not set. You will need to set this to use OKX DEX features.');
}

// WebSocket Proxy validation
if (!process.env.EXTERNAL_WEBSOCKET_URLS && config.externalWebsocketUrls.length > 0) {
  console.log('✅ Using default external WebSocket endpoints:');
  config.externalWebsocketUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
} else if (process.env.EXTERNAL_WEBSOCKET_URLS) {
  console.log('✅ Using custom external WebSocket endpoints from environment:');
  config.externalWebsocketUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
} else if (config.externalWebsocketUrls.length === 0) {
  console.error('🚨 ERROR: No external WebSocket endpoints configured!');
  console.error('   Please set EXTERNAL_WEBSOCKET_URLS environment variable or check config.');
}
