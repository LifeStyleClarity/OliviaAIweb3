import axiosInstanceAPIGateway from '../config/axios-gateway.js';
import axiosInstanceTonAPI from '../config/axios-ton.js';
import { ENDPOINTS } from "../config/endpoints.js";
import axios from 'axios';

/**
 * Transaction service for handling token swaps and transactions
 */
class TransactionService {
    /**
     * Get transaction parameters for a swap
     * @param {string} walletAddress - The wallet address
     * @param {string|number} amount - The amount to swap
     * @param {string} contractAddress - The contract address of the token
     * @param {string} swapType - The type of swap ("Buy" or "Sell")
     * @returns {Promise<Object>} Transaction parameters
     */
    async getTransactionParams(walletAddress, amount, contractAddress, swapType) {
        try {
            // Convert parameters to match API expectations (strings)
            const resp = await axiosInstanceTonAPI.post(
                ENDPOINTS.TRANSACTION.GET_TX_PARAMS_V2,
                {
                    userWalletAddress: walletAddress,
                    offerAmount: amount.toString(), // API expects string
                    askJettonAddress: contractAddress,
                    swapType: swapType,
                }
            );

            // Log the response for debugging
            //console.log("API Response:", resp.data);

            // Check if the response has the expected structure
            if (resp.data && resp.data.data && resp.data.data.txParams) {
                // Return the data object containing txParams and other information
                return resp.data.data;
            } else if (resp.data && resp.data.txParams) {
                // Alternative structure with txParams directly in the response
                return resp.data;
            } else {
                console.error("Unexpected API response structure:", resp.data);
                throw new Error("Invalid response structure from API");
            }
        } catch (error) {
            console.error("Error getting transaction parameters:", error);
            throw error;
        }
    }

    /**
     * Verify a transaction
     * @param {string} walletAddress - The wallet address
     * @returns {Promise<Object>} Verification result
     */
    async verifyTransaction(walletAddress) {
        try {
            const now = Math.floor(Date.now() / 1000); // Current timestamp

            const response = await axiosInstanceTonAPI.post(
                ENDPOINTS.TRANSACTION.VERIFY_TRANSACTION,
                {
                    userWalletAddress: walletAddress,
                    now: now,
                }
            );

            return response.data;
        } catch (error) {
            console.error("Error verifying transaction:", error);
            throw error;
        }
    }

    /**
     * Get transaction parameters for selling a specific trade
     * @param {string} walletAddress - The wallet address
     * @param {string|number} specificAmount - The specific amount to sell
     * @param {string} contractAddress - The contract address of the token
     * @returns {Promise<Object>} Transaction parameters
     */
    async getSpecificSellTransactionParams(walletAddress, specificAmount, contractAddress) {
        try {
            const resp = await axiosInstanceTonAPI.post(
                ENDPOINTS.TRANSACTION.GET_TX_PARAMS_SPECIFIC_SELL,
                {
                    userWalletAddress: walletAddress,
                    specificAmount: specificAmount.toString(), // API expects string
                    offerJettonAddress: contractAddress
                }
            );

            // Check if the response has the expected structure
            if (resp.data && resp.data.data && resp.data.data.txParams) {
                // Return the data object containing txParams and other information
                return resp.data.data;
            } else if (resp.data && resp.data.txParams) {
                // Alternative structure with txParams directly in the response
                return resp.data;
            } else {
                console.error("Unexpected API response structure:", resp.data);
                throw new Error("Invalid response structure from API");
            }
        } catch (error) {
            console.error("Error getting specific sell transaction parameters:", error);
            throw error;
        }
    }

    /**
     * Buy TON with credit card using ChangeNOW API
     * @param {string} walletAddress - The TON wallet address to receive the tokens
     * @param {string|number} amount - The amount of TON to buy (fixed at 1 TON)
     * @returns {Promise<Object>} Transaction details including payment URL
     */
    async buyTonWithCreditCard(walletAddress, amount) {
        try {
            // Get API key from environment variables
            const API_KEY = import.meta.env.VITE_CHANGE_NOW_API_KEY;

            if (!API_KEY) {
                throw new Error("ChangeNOW API key is not configured");
            }

            // Calculate EUR amount based on current TON price and the requested TON amount
            // For simplicity, we're using a fixed price of 50 EUR per TON
            // In a production app, you would fetch the current TON price and calculate this dynamically
            const usdAmount = 10 * amount;

            // Build the request payload according to ChangeNOW API format
            const requestBody = {
                from_amount: usdAmount,       // Amount in EUR
                from_currency: "USD",         // The fiat currency the user pays with
                to_currency: "TON",           // The target cryptocurrency (Toncoin)
                from_network: null,           // Not applicable for fiat
                to_network: "TON",            // Network for TON
                payout_address: walletAddress, // User's TON wallet address
                payout_extra_id: "",          // Not needed for TON
                deposit_type: "SEPA_1",       // Default deposit type for EUR
                payout_type: "SEPA_1",        // Default payout type
                external_partner_link_id: ""  // Optional tracking parameter
            };

            // Make the API request
            const response = await axios.post(
                ENDPOINTS.TRANSACTION.BUY_TON_CREDIT_CARD,
                requestBody,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-changenow-api-key": API_KEY
                    }
                }
            );

            // Log the response for debugging
            //console.log("ChangeNOW API Response:", response.data);

            return response.data;
        } catch (error) {
            console.error("Error buying TON with credit card:", error);
            throw error;
        }
    }


    async createTransaction(payload) {
        try {
            const response = await axiosInstanceAPIGateway.post(
                ENDPOINTS.TRADING.CREATE_TRANSACTIONS,
                payload
            );
            return response.data.data;
        } catch (error) {
            console.error('Error creating trade:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const transactionService = new TransactionService();
