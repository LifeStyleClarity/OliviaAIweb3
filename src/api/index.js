/**
 * API Module
 * 
 * This module exports all API-related functionality:
 * 
 * Services:
 * - portfolioService: TON Portfolio microservice integration
 * - socialService: Social data with authentication
 * - chatService: WebSocket chat and audio communication
 * 
 * Types:
 * - Portfolio types for TON integration
 * - Social types for influencer and token data
 * 
 * Configuration:
 * - ENDPOINTS: API endpoint configuration
 * - WebSocket URLs for chat and audio
 * 
 * Usage examples:
 * 
 * ```javascript
 * // Portfolio service
 * import { portfolioService } from '@/api';
 * const portfolio = await portfolioService.getPortfolio(address);
 * 
 * // Social service
 * import { socialService } from '@/api';
 * const influencers = await socialService.getInfluencers();
 * 
 * // Chat service
 * import { chatService } from '@/api';
 * const wsUrl = chatService.getChatWebSocketUrl();
 * const messageData = chatService.createMessageData("Hello", previousMessages);
 * ```
 */

// Services
export { portfolioService } from './services/portfolio.service.js';
export { socialService } from './services/social.service.js';
export { chatService } from './services/chat.service.js';
export * as authService from './services/auth.service.js';
export { notificationService } from './services/notification.service.js';
export { tradeService } from './services/trade.service.js';
export { profileService } from './services/profile.service.js';
export { airdropService } from './services/airdrop.service.js';
export { transactionService } from './services/transaction.service.js';
export { tokenService } from './services/token.service.js';
export { aiService } from './services/ai.service.js';

// Types
export * from './types/portfolio.types.js';
export * from './types/social.types.js';
export * from './types/auth.types.js';
export * from './types/notification.types.js';
export * from './types/trade.types.js';
export * from './types/airdrop.types.js';
export * from './types/chat.types.js';
export * from './types/token.types.js';

// Config
export { ENDPOINTS } from './config/endpoints.js';
