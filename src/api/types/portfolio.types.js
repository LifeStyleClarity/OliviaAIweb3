/**
 * @typedef {Object} PortfolioToken
 * @property {string} coinId - Unique identifier for the token
 * @property {number} amount - Token balance
 * @property {string} contractAddress - Token contract address
 * @property {string} chain - Blockchain network
 * @property {string} name - Token name
 * @property {string} symbol - Token symbol
 * @property {number} price - Current price in USD
 * @property {number} priceBtc - Current price in BTC
 * @property {string} imgUrl - Token icon URL
 * @property {number} pCh24h - 24h price change percentage
 * @property {number} rank - Market cap rank
 * @property {number} volume - 24h trading volume
 * @property {number} [decimals] - Token decimals (optional)
 */

/**
 * @typedef {Object} PortfolioResponse
 * @property {PortfolioToken[]} portfolio - Array of portfolio tokens
 */

export {}; // Ensures this is treated as a module
