/**
 * @typedef {Object} Cashtag
 * @property {string} cashtag - The token symbol/cashtag (e.g., "BTC", "ETH", "TON")
 * @property {number} mentions - Number of mentions for this cashtag
 */

/**
 * @typedef {Object} Influencer
 * @property {string} id - Unique identifier
 * @property {string} name - Influencer name
 * @property {string} [username] - Social media username
 * @property {Cashtag[]} cashtags - Array of cashtags with mention counts
 */

/**
 * @typedef {Object} Token
 * @property {string} token_symbol - Token symbol matching cashtag
 * @property {string} token_icon - Token icon URL
 * @property {boolean} force_show - Whether to prioritize this token in display
 * @property {string} [name] - Token name
 * @property {string} [contract_address] - Token contract address
 * @property {number} [price] - Current token price
 * @property {number} [market_cap] - Token market capitalization
 * @property {number} [volume] - Trading volume
 */

/**
 * @typedef {Object} TopCashtagWithToken
 * @property {string} cashtag - The token symbol/cashtag
 * @property {number} totalMentions - Aggregated mentions across all influencers
 * @property {Token} data - Complete token data including price, icon, etc.
 */

export {};
