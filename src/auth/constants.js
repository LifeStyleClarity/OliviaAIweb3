/**
 * Authentication Constants
 */

// Default token images
export const DEFAULT_TOKENS = {
  ONAI: {
    coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
    coin_name: "ONAI",
    image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z"
  },
  TONAI: {
    coin_id: "b314e305-f678-4572-a10c-fba28990d4c3",
    coin_name: "TONAI",
    image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/TONAI_COIN.gif"
  },
  SENTAI: {
    coin_id: "cec39e92-6c8d-4ba1-a33c-b5951066ba22",
    coin_name: "SENTAI",
    image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/SENTAI_COIN.gif?t=2024-07-08T15%3A48%3A25.095Z"
  }
};

// Default values for new user profile settings
export const DEFAULT_PROFILE_SETTINGS = {
  trade_style: "Manual",
  risk_profile: "Low",
  stop_loss: 0.2,
  take_profit: 0.2,
  trailing_stop: 0.2,
  slippage: 0.1,
  current_step: 1
};

// Default values for new Galaxy Blaster instance
export const DEFAULT_GALAXY_VALUES = {
  last_score: 0,
  high_score: 0,
  total_score: 0,
  season_two_total_score: 0,
  games_played: 0,
  points_by_click: 0,
  referral_points_earned: 0,
  aliens_threshold: 50,
  total_aliens_killed: 0
};

// Modal messages for different auth scenarios
export const MODAL_MESSAGES = {
  WALLET_MISMATCH: {
    title: "Wallet Mismatch Detected",
    description: "We already have a user record under your Telegram account with a different wallet. Do you want to replace with this wallet you're trying to login?"
  },
  MULTIPLE_ACCOUNTS: {
    title: "Multiple Accounts Detected",
    description: "Multiple accounts are associated with your Telegram. Do you want to aggregate them all to this wallet? If not click cancel and connect the desired wallet"
  },
  ADD_WALLET: {
    title: "Add Wallet",
    description: "We already have a user record under your Telegram account from Galaxy Blaster but you never connected a wallet. Do you want to add the wallet you're trying to login to this user?"
  },
  AGGREGATE_NEW: {
    title: "Multiple Accounts Detected",
    description: "Multiple accounts are associated with your Telegram. Do you want to aggregate them all to this wallet? If not click cancel and connect the desired wallet"
  }
};

// Error messages
export const ERROR_MESSAGES = {
  TELEGRAM_REQUIRED: "You need to be using our app on telegram",
  WALLET_UPDATE_ERROR: "Error aggregating wallets, please login with a valid TON wallet",
  USER_CREATE_ERROR: "Error creating user",
  GALAXY_CREATE_ERROR: "Error creating galaxy instance",
  PROFILE_CREATE_ERROR: "Error creating profile settings"
};
