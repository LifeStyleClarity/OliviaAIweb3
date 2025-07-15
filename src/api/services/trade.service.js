
import axiosInstanceAPIGateway from '../config/axios-gateway.js';
import { ENDPOINTS } from '../config/endpoints.js';

/**
 * Trade API service for handling trade operations
 */
class TradeService {
    /**
     * Create a new trade
     * @param {import('../types/trade.types').CreateTradePayload} payload - Trade creation data
     * @returns {Promise<import('../types/trade.types').Trade>}
     */
    async createTrade(payload) {
        try {
            const response = await axiosInstanceAPIGateway.post(
                ENDPOINTS.TRADING.CREATE_TRADE,
                payload
            );
            return response.data.data;
        } catch (error) {
            console.error('Error creating trade:', error);
            throw error;
        }
    }

    /**
     * Update an existing trade
     * @param {string} tradeId - ID of the trade to update
     * @param {import('../types/trade.types').UpdateTradePayload} updateData - Data to update
     * @returns {Promise<import('../types/trade.types').Trade>}
     */
    async updateTrade(tradeId, updateData) {
        try {
            const response = await axiosInstanceAPIGateway.put(
                ENDPOINTS.TRADING.UPDATE_TRADE.replace(':id', tradeId),
                updateData
            );
            return response.data.data;
        } catch (error) {
            console.error('Error updating trade:', error);
            throw error;
        }
    }

    /**
     * Get trades for a specific user
     * @param {string} userId - ID of the user
     * @returns {Promise<import('../types/trade.types').Trade[]>}
     */
    async getUserTrades(userId) {
        if (!userId) {
            console.warn('getUserTrades called without userId');
            return [];
        }

        try {
            // Remove any double slashes in the URL
            const endpoint = ENDPOINTS.TRADING.GET_USER_TRADES
                .replace(':id', userId)
                .replace(/([^:]\/)\/+/g, '$1');

            //console.log('Fetching trades from:', endpoint);
            const response = await axiosInstanceAPIGateway.get(endpoint);
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                //console.log('No trades found for user:', userId);
                return [];
            }
            console.error('Error fetching trades:', error);
            throw error;
        }
    }

    /**
     * Get a specific trade by ID
     * @param {string} tradeId - ID of the trade to fetch
     * @returns {Promise<import('../types/trade.types').Trade>}
     */
    async getTrade(tradeId) {
        try {
            const response = await axiosInstanceAPIGateway.get(
                ENDPOINTS.TRADING.GET_TRADE.replace(':id', tradeId)
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
     * Delete a specific trade
     * @param {string} tradeId - ID of the trade to delete
     * @returns {Promise<void>}
     */
    async deleteTrade(tradeId) {
        try {
            await axiosInstanceAPIGateway.delete(
                ENDPOINTS.TRADING.DELETE_TRADE.replace(':id', tradeId)
            );
        } catch (error) {
            console.error('Error deleting trade:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const tradeService = new TradeService();
