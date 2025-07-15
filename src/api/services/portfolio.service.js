import axiosInstanceTonAPI from '../config/axios-ton.js';
import { ENDPOINTS } from '../config/endpoints.js';

/**
 * Portfolio API service for handling TON portfolio data
 * Note: This service uses a different microservice endpoint (TON API)
 * and does not require the secret key interceptor
 */
class PortfolioService {
    /**
     * Fetches the portfolio data for a given wallet address
     * @param {string} walletAddress - The wallet address to fetch portfolio for
     * @returns {Promise<import('../types/portfolio.types').PortfolioResponse>}
     */
    async getPortfolio(walletAddress) {
        try {
            const response = await axiosInstanceTonAPI.post(ENDPOINTS.PORTFOLIO.GET_PORTFOLIO, {walletAddress})
            return this.formatPortfolioData(response.data.data);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            throw new Error(`Failed to fetch portfolio: ${error.message}`);
        }
    }

    /**
     * Formats the portfolio data with additional calculations
     * @private
     * @param {import('../types/portfolio.types').PortfolioResponse} data 
     * @returns {import('../types/portfolio.types').PortfolioToken[]}
     */
    formatPortfolioData(data) {
        if (!data.portfolio || !Array.isArray(data.portfolio)) {
            throw new Error('Invalid portfolio data format');
        }

        return data.portfolio.map(token => ({
            ...token,
            totalValue: token.amount * token.price,
            formattedAmount: token.decimals 
                ? token.amount / Math.pow(10, token.decimals)
                : token.amount
        }));
    }
}

// Export a singleton instance
export const portfolioService = new PortfolioService();
