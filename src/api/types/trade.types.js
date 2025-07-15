/**
 * @typedef {Object} Trade
 * @property {string} trade_id - Unique identifier for the trade
 * @property {string} user_id - ID of the user who made the trade
 * @property {string} token_address - Contract address of the traded token
 * @property {string} token_symbol - Symbol of the traded token
 * @property {number} amount - Amount of tokens traded
 * @property {number} price - Price at which the trade was executed
 * @property {string} type - Type of trade ('BUY' or 'SELL')
 * @property {string} status - Status of the trade ('PENDING', 'COMPLETED', 'FAILED')
 * @property {string} created_at - Timestamp when the trade was created
 * @property {string} updated_at - Timestamp when the trade was last updated
 */

/**
 * @typedef {Object} CreateTradePayload
 * @property {string} user_id - ID of the user making the trade
 * @property {string} token_address - Contract address of the token to trade
 * @property {string} token_symbol - Symbol of the token to trade
 * @property {number} amount - Amount of tokens to trade
 * @property {number} price - Price at which to execute the trade
 * @property {string} type - Type of trade ('BUY' or 'SELL')
 */

/**
 * @typedef {Object} UpdateTradePayload
 * @property {string} [status] - New status of the trade
 * @property {number} [amount] - Updated amount of tokens
 * @property {number} [price] - Updated trade price
 */

export {};
