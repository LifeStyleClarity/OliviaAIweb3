import axiosInstanceTonAPI from '../config/axios-ton.js';
import { ENDPOINTS } from '../config/endpoints.js';

/**
 * Airdrop API service for handling user airdrop data
 */
class AirdropService {
    /**
     * Get airdrop data for a user
     * @param {string} userId - The user ID to fetch airdrop data for
     * @returns {Promise<import('../types/airdrop.types').AirdropData>} Airdrop data including points and claim status
     */
    async getAirdropData(userId) {
        if (!userId) return null;

        try {
            const response = await axiosInstanceTonAPI.get(
                ENDPOINTS.AIRDROP.GET_USER_AIRDROP.replace(':id', userId)
            );
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error fetching airdrop data:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const airdropService = new AirdropService();
