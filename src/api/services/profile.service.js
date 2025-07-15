import axiosInstanceAPIGateway from '../config/axios-gateway.js';
import { ENDPOINTS } from '../config/endpoints.js';

/**
 * Profile Settings API service for handling user profile settings
 */
class ProfileService {
    /**
     * Check if profile settings exist for a user
     * @param {string} userId - The user ID to check settings for
     * @returns {Promise<Object|null>} Profile settings if they exist, null otherwise
     */
    async checkProfileSettingsExists(userId) {
        if (!userId) return null;
        
        try {
            const response = await axiosInstanceAPIGateway.get(
                ENDPOINTS.PROFILE_SETTINGS.GET_USER_SETTINGS.replace(':id', userId)
            );
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Create new profile settings for a user
     * @param {Object} settings - The settings data to create
     * @returns {Promise<Object>} Created profile settings
     */
    async createProfileSettings(settings) {
        try {
            const response = await axiosInstanceAPIGateway.post(
                ENDPOINTS.PROFILE_SETTINGS.CREATE_SETTINGS,
                settings
            );
            return response.data.data;
        } catch (error) {
            console.error('Error creating profile settings:', error);
            throw error;
        }
    }

    /**
     * Update profile settings for a user
     * @param {string} userId - The user ID to update settings for
     * @param {Object} updateData - The settings data to update
     * @returns {Promise<Object>} Updated profile settings
     */
    async updateProfileSettings(userId, updateData) {
        if (!userId) return null;
        
        try {
            const response = await axiosInstanceAPIGateway.put(
                ENDPOINTS.PROFILE_SETTINGS.UPDATE_SETTINGS.replace(':id', userId),
                updateData
            );
            return response.data.data;
        } catch (error) {
            console.error('Error updating profile settings:', error);
            throw error;
        }
    }

    /**
     * Create default profile settings for a user
     * @param {string} userId - The user ID to create default settings for
     * @returns {Promise<Object>} Created default profile settings
     */
    async createDefaultSettings(userId) {
        const defaultSettings = {
            user_id: userId,
            trade_style: "Manual",
            wallets: [],
            risk_profile: "Low",
            stop_loss: 0.2,
            take_profit: 0.2,
            trailing_stop: 0.2,
            slippage: 0.1,
            current_step: 1,
        };

        return this.createProfileSettings(defaultSettings);
    }
}

// Export a singleton instance
export const profileService = new ProfileService();
