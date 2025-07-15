import axiosInstanceAPIGateway from '../config/axios-gateway.js';
import { ENDPOINTS } from '../config/endpoints.js';

/**
 * Token API service for handling token operations
 */
class TokenService {
    /**
     * Get token information by contract address
     * @param {string} tokenAddress - The contract address of the token
     * @returns {Promise<Object>} - Token information
     */
    async getTokenByAddress(tokenAddress) {
        try {
            // Normalize the token address if needed
            const normalizedAddress = tokenAddress;
            
            const response = await axiosInstanceAPIGateway.get(
                ENDPOINTS.TOKENS.GET_BY_ADDRESS.replace(':token_address', normalizedAddress)
            );
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('Token not found:', tokenAddress);
                return null;
            }
            console.error('Error fetching token:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const tokenService = new TokenService();
