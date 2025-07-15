import { DEFAULT_TOKENS, DEFAULT_GALAXY_VALUES, DEFAULT_PROFILE_SETTINGS } from '../constants';

/**
 * Creates a default Galaxy Blaster instance for a new user
 * @param {string} userId - The user's ID
 * @param {string|null} walletAddress - The user's wallet address (optional)
 * @returns {Object} A new Galaxy Blaster instance with default values
 */
export const createDefaultGalaxyInstance = (userId, walletAddress = null) => ({
  user_id: userId,
  crypto_wallet_address: walletAddress,
  ...DEFAULT_GALAXY_VALUES,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tokens_collected: [
    {
      amount: 0,
      ...DEFAULT_TOKENS.ONAI
    },
    {
      amount: 0,
      ...DEFAULT_TOKENS.TONAI
    },
    {
      amount: 0,
      ...DEFAULT_TOKENS.SENTAI
    }
  ],
  season_two_tokens_collected: [
    {
      amount: 0,
      ...DEFAULT_TOKENS.ONAI
    }
  ]
});

/**
 * Creates default profile settings for a new user
 * @param {string} userId - The user's ID
 * @returns {Object} Default profile settings
 */
export const createDefaultProfileSettings = (userId) => ({
  user_id: userId,
  wallets: [],
  ...DEFAULT_PROFILE_SETTINGS
});

/**
 * Creates a new user object with default values
 * @param {Object} params - Parameters for user creation
 * @param {string} [params.walletAddress] - The user's wallet address
 * @param {string} [params.walletType] - The type of wallet used
 * @param {string} [params.refCode] - Referral code used
 * @param {string} [params.generatedRefCode] - Generated referral code
 * @param {Array} [params.telegramInfo] - Telegram user information
 * @param {string} [params.telegramId] - Telegram user ID
 * @param {boolean} [params.isTeleUser] - Whether this is a Telegram-only user
 * @returns {Object} A new user object with default values
 */
export const createDefaultUser = ({
  walletAddress = null,
  walletType = null,
  refCode = null,
  generatedRefCode,
  telegramInfo = [],
  telegramId = null,
  isTeleUser = false
}) => ({
  crypto_wallet_address: walletAddress,
  crypto_wallet_type: walletType,
  used_ref_code: refCode,
  genereated_ref_code: generatedRefCode,
  telegram_info: telegramInfo,
  telegram_id: telegramId,
  registration_date: new Date().toISOString(),
  last_login_date: new Date().toISOString().slice(0, 10),
  is_tele_user: isTeleUser
});
