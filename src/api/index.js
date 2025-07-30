/**
 * API Module
 * 
 * This module exports all API-related functionality:
 * 
 * Services:
 * - chatService: WebSocket chat and audio communication
 * - authService: Authentication services
 * - notificationService: Notification handling
 * - airdropService: Airdrop functionality
 * - icpService: ICP blockchain integration
 * 
 * Configuration:
 * - ENDPOINTS: API endpoint configuration
 * 
 * Usage examples:
 * 
 * ```javascript
 * // Chat service
 * import { chatService } from '@/api';
 * const wsUrl = chatService.getChatWebSocketUrl();
 * const messageData = chatService.createMessageData("Hello", previousMessages);
 * 
 * // Auth service
 * import { authService } from '@/api';
 * ```
 */

// Services - only export services that actually exist
export { chatService } from './services/chat.service.js';
export * as authService from './services/auth.service.js';
export { notificationService } from './services/notification.service.js';
export { airdropService } from './services/airdrop.service.js';
export { icpService } from './services/icp.service.js';

// Config
export { ENDPOINTS } from './config/endpoints.js';
