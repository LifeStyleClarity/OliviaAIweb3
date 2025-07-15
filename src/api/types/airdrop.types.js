/**
 * @typedef {Object} UserWalletAndId
 * @property {string} user_id - Unique identifier for the user
 * @property {number} ai_chat_points - Points earned from AI chat interactions
 * @property {number} onbassador_points - Points earned from onbassador program
 * @property {string} crypto_wallet_address - User's crypto wallet address
 * @property {number} galaxy_blaster_points - Points earned from Galaxy Blaster game
 */

/**
 * @typedef {Object} UserClaimedData
 * @property {string} id - Unique identifier for the claim
 * @property {string} created_at - Timestamp when the claim was created
 * @property {number} total_points - Total points accumulated
 * @property {number} onbassador_points - Points earned from onbassador program
 * @property {number} ai_chat_points - Points earned from AI chat interactions
 * @property {UserWalletAndId[]} user_wallets_and_ids - Array of user wallets and their associated points
 * @property {string} telegram_handle - User's Telegram handle
 * @property {string} telegram_id - User's Telegram ID
 * @property {number} galaxy_blaster_points - Points earned from Galaxy Blaster game
 * @property {string} airdrop_wallet - Wallet address for receiving the airdrop
 */

/**
 * @typedef {Object} AirdropData
 * @property {number} galaxy_blaster_season_one_total_points - Total points from Galaxy Blaster season one
 * @property {number} galaxy_blaster_season_two_total_points - Total points from Galaxy Blaster season two
 * @property {number} chat_season_one_total_points - Total points from chat season one
 * @property {number} chat_season_two_total_points - Total points from chat season two
 * @property {number} onbassador_total_points - Total points from onbassador program
 * @property {UserClaimedData[]} user_claimed_data - Array of user claimed data (can be empty if user_claimed_airdrop is false)
 * @property {boolean} user_claimed_airdrop - Whether the user has claimed the airdrop
 */

export {}; // Ensures this is treated as a module
