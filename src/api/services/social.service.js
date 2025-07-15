
import axiosInstanceAPIGateway, { logError } from '../config/axios-gateway.js';
import { ENDPOINTS } from '../config/endpoints.js';

/**
 * Social API service for handling influencer and token data
 */
class SocialService {
    /**
     * Fetches influencer data with cashtags and mentions
     * @returns {Promise<import('../types/social.types').Influencer[]>}
     */
    async getInfluencers() {
        try {
            const response = await axiosInstanceAPIGateway.get(ENDPOINTS.SOCIAL.GET_INFLUENCERS);
            return response.data.data;
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    async getInfluencersById(id) {
        try {
            const response = await axiosInstanceAPIGateway.get(ENDPOINTS.SOCIAL.GET_INFLUENCER_BY_ID.replace(':id', id));
            return response.data.data;
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    async updateInfluencersById(id, updateData) {
        try {
            const response = await axiosInstanceAPIGateway.put(
                ENDPOINTS.SOCIAL.UPDATE_INFLUENCER_BY_ID.replace(':id', id),
                updateData
            );
            return response.data.data;
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Fetches token data
     * @returns {Promise<import('../types/social.types').Token[]>}
     */
    async getTokens() {
        try {
            const response = await axiosInstanceAPIGateway.get(ENDPOINTS.SOCIAL.GET_TOKENS);
            return response.data.data;
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Gets the top mentioned tokens with their data
     * @param {number} limit - Number of top tokens to return (default 3)
     * @returns {Promise<import('../types/social.types').TopCashtagWithToken[]>}
     */
    async getTopMentionedTokens(limit = 3) {
        try {
            // Fetch both data sets in parallel
            const [influencersData, tokensData] = await Promise.all([
                this.getInfluencers(),
                this.getTokens()
            ]);

            // 1. Accumulate total mentions per cashtag across all influencers
            const mentionMap = {}; // e.g. { BTC: 30, ETH: 25, TON: 15, ... }
            influencersData.forEach((influencer) => {
                influencer.cashtags?.forEach(({ cashtag, mentions }) => {
                    if (!mentionMap[cashtag]) {
                        mentionMap[cashtag] = 0;
                    }
                    mentionMap[cashtag] += mentions;
                });
            });

            // 2. Turn the mention map into an array we can sort
            const mentionArray = Object.entries(mentionMap).map(
                ([cashtag, totalMentions]) => ({ cashtag, totalMentions })
            );

            // 3. Sort by descending number of mentions
            mentionArray.sort((a, b) => b.totalMentions - a.totalMentions);

            // 4. Take the top N cashtags
            const topCashtags = mentionArray.slice(0, limit);

            // 5. For each top cashtag, find the token with `force_show` or fallback to first
            return topCashtags.reduce((acc, { cashtag, totalMentions }) => {
                // a) find all tokens with the same symbol
                const matchingTokens = tokensData.filter(
                    (token) => token.token_symbol === cashtag
                );
                if (matchingTokens.length === 0) {
                    return acc; // no tokens match, skip
                }

                // b) find a forced token or fall back to the first
                const forcedToken = matchingTokens.find((token) => token.force_show);
                const chosenToken = forcedToken || matchingTokens[0];

                // c) skip if no icon
                if (!chosenToken.token_icon) {
                    return acc;
                }
                // d) push to results
                acc.push({
                    cashtag,
                    totalMentions,
                    data: chosenToken, // the chosen token object
                });
                //console.log("tokensData: ",acc)
                return acc;
            }, []);

        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Fetches mentions data for cashtags
     * @returns {Promise<Array<{cashtag: string, mentions: number}>>}
     */
    async getMentions() {
        try {
            const response = await axiosInstanceAPIGateway.get(ENDPOINTS.SOCIAL.GET_MENTIONS);
            return response.data.data;
        } catch (error) {
            logError(error);
            throw error;
        }
    }
}

// Export a singleton instance
export const socialService = new SocialService();
