/**
 * API Module
 * 
 * This module exports all API-related functionality:
 * 
 * Services:
 * - chatService: WebSocket chat and audio communication
 * - aiService: AI chat and streaming functionality
 * - authService: User authentication and management
 * 
 * Configuration:
 * - ENDPOINTS: API endpoint configuration
 * - WebSocket URLs for chat and audio
 * 
 * Usage examples:
 * 
 * ```javascript
 * // Chat service
 * import { chatService } from '@/api';
 * const wsUrl = chatService.getChatWebSocketUrl();
 * const messageData = chatService.createMessageData("Hello", previousMessages);
 * 
 * // Crypto data services
 * import { coingeckoService, lurkyService } from '@/api';
 * const prices = await coingeckoService.getPrices(['bitcoin']);
 * const coinData = await lurkyService.getCoins('BTC');
 * ```
 */

// Services
export { chatService } from './services/chat.service.js';
export * as authService from './services/auth.service.js';



export { aiService } from './services/ai.service.js';
export { lurkyService } from './services/lurky.service.js';
export { coingeckoService } from './services/coingecko.service.js';
export { coinstatsService } from './services/coinstats.service.js';
export { changeNowService } from './services/changenow.service.js';
export { hgraphService } from './services/hgraph.service.js';
export { icpService } from './services/icp.service.js';
export { privacyService } from './services/privacy.service.js';
export { okxDexService } from './services/okx-dex.service.js';

// Types
export * from './types/auth.types.js';

export * from './types/chat.types.js';

// Config
export { ENDPOINTS } from './config/endpoints.js';
