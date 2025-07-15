/**
 * Authentication Module
 * 
 * This module exports the authentication functionality for both TON Connect wallet
 * and Telegram authentication methods.
 */

// Auth Hooks
export { useTonConnectAuth } from './TonConnectAuth';
export { useTelegramAuth } from './TelegramAuth';

// Types
export * from './AuthTypes';

// Constants
export { ERROR_MESSAGES } from './constants';

// Utils
export { generateRefCode, convertAddress, shortenPublicKey } from './utils/helpers';
