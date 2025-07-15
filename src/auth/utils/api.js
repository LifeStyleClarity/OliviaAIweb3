import * as authService from '../../api/services/auth.service';
import { createAuthError } from './helpers';
import { ERROR_MESSAGES } from '../constants';

/**
 * Wrapper for checkUserExists with enhanced error handling
 * @param {string} walletAddress - Wallet address to check
 * @returns {Promise<Object|null>} User object if found, null if not found
 */
export const checkUserExists = async (walletAddress) => {
  try {
    return await authService.checkUserExists(walletAddress);
  } catch (error) {
    throw createAuthError('CHECK_USER_EXISTS', error.message);
  }
};

/**
 * Wrapper for getAllUsersTelegramId with enhanced error handling
 * @param {string} telegramId - Telegram ID to check
 * @returns {Promise<Array|null>} Array of users if found, null if not found
 */
export const getAllUsersTelegramId = async (telegramId) => {
  try {
    return await authService.getAllUsersTelegramId(telegramId);
  } catch (error) {
    throw createAuthError('GET_TELEGRAM_USERS', error.message);
  }
};

/**
 * Wrapper for updateUser with enhanced error handling
 * @param {string} userId - User ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = async (userId, updateData) => {
  try {
    return await authService.updateUser(userId, updateData);
  } catch (error) {
    throw createAuthError('UPDATE_USER', error.message);
  }
};

/**
 * Wrapper for createUser with enhanced error handling
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (userData) => {
  try {
    const user = await authService.createUser(userData);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_CREATE_ERROR);
    }
    return user;
  } catch (error) {
    throw createAuthError('CREATE_USER', error.message);
  }
};

/**
 * Wrapper for aggregateUsers with enhanced error handling
 * @param {string} userId - User ID to aggregate
 * @returns {Promise<Object>} Aggregation result
 */
export const aggregateUsers = async (userId) => {
  try {
    const result = await authService.aggregateUsers(userId);
    if (!result || !result.success) {
      throw new Error(ERROR_MESSAGES.WALLET_UPDATE_ERROR);
    }
    return result;
  } catch (error) {
    throw createAuthError('AGGREGATE_USERS', error.message);
  }
};

/**
 * Wrapper for walletChange with enhanced error handling
 * @param {string} userId - User ID to change wallet for
 * @param {string} wallet - New wallet address
 * @param {string} walletType - Type of wallet
 * @returns {Promise<Object>} Change result
 */
export const walletChange = async (userId, wallet, walletType) => {
  try {
    const result = await authService.walletChange(userId, wallet, walletType);
    if (!result || !result.success) {
      throw new Error(ERROR_MESSAGES.WALLET_UPDATE_ERROR);
    }
    return result;
  } catch (error) {
    throw createAuthError('WALLET_CHANGE', error.message);
  }
};

/**
 * Wrapper for checkGalaxyBlasterInstance with enhanced error handling
 * @param {string} userId - User ID to check
 * @returns {Promise<Object|null>} Galaxy instance if found, null if not found
 */
export const checkGalaxyBlasterInstance = async (userId) => {
  try {
    return await authService.checkGalaxyBlasterInstance(userId);
  } catch (error) {
    throw createAuthError('CHECK_GALAXY_INSTANCE', error.message);
  }
};

/**
 * Wrapper for createGalaxyBlasterInstance with enhanced error handling
 * @param {Object} instanceData - Instance data to create
 * @returns {Promise<Object>} Created instance
 */
export const createGalaxyBlasterInstance = async (instanceData) => {
  try {
    const instance = await authService.createGalaxyBlasterInstance(instanceData);
    if (!instance) {
      throw new Error(ERROR_MESSAGES.GALAXY_CREATE_ERROR);
    }
    return instance;
  } catch (error) {
    throw createAuthError('CREATE_GALAXY_INSTANCE', error.message);
  }
};

/**
 * Wrapper for updateGalaxyBlasterInstance with enhanced error handling
 * @param {string} userId - User ID to update
 * @param {string} walletAddress - New wallet address
 * @returns {Promise<Object>} Updated instance
 */
export const updateGalaxyBlasterInstance = async (userId, walletAddress) => {
  try {
    return await authService.updateGalaxyBlasterInstance(userId, walletAddress);
  } catch (error) {
    throw createAuthError('UPDATE_GALAXY_INSTANCE', error.message);
  }
};

/**
 * Wrapper for checkUserProfileSettingsExists with enhanced error handling
 * @param {string} userId - User ID to check
 * @returns {Promise<Object|null>} Profile settings if found, null if not found
 */
export const checkUserProfileSettingsExists = async (userId) => {
  try {
    return await authService.checkUserProfileSettingsExists(userId);
  } catch (error) {
    throw createAuthError('CHECK_PROFILE_SETTINGS', error.message);
  }
};

/**
 * Wrapper for createProfileSettingsUser with enhanced error handling
 * @param {Object} settingsData - Settings data to create
 * @returns {Promise<Object>} Created settings
 */
export const createProfileSettingsUser = async (settingsData) => {
  try {
    const settings = await authService.createProfileSettingsUser(settingsData);
    if (!settings) {
      throw new Error(ERROR_MESSAGES.PROFILE_CREATE_ERROR);
    }
    return settings;
  } catch (error) {
    throw createAuthError('CREATE_PROFILE_SETTINGS', error.message);
  }
};

/**
 * Wrapper for airdropWalletUpdate with enhanced error handling
 * @param {string} telegramId - Telegram ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update response
 */
export const airdropWalletUpdate = async (telegramId, updateData) => {
  try {
    return await authService.airdropWalletUpdate(telegramId, updateData);
  } catch (error) {
    throw createAuthError('AIRDROP_WALLET_UPDATE', error.message);
  }
};
