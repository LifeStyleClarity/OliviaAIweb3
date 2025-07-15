import axiosInstanceAPIGateway from '../config/axios-gateway.js';
import { ENDPOINTS } from '../config/endpoints.js';

class NftService {

    async getNfts(walletAddress) {
        if (!walletAddress) return null;

        try {
            const response = await axiosInstanceAPIGateway.get(
                ENDPOINTS.NFT.GET_NFT.replace(':walletAddress', walletAddress)
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
export const nftService = new NftService();
