/**
 * Auth Modal Types
 * 
 * Defines the different types of authentication modals that can be displayed
 * during the login and wallet connection process.
 */
export const AuthModalType = {
  /** When a user tries to connect a wallet that differs from their existing one */
  WALLET_MISMATCH: 'WALLET_MISMATCH',
  
  /** When a Telegram user wants to add a wallet to their account */
  ADD_WALLET: 'ADD_WALLET',
  
  /** When multiple accounts are found for the same Telegram ID */
  MULTIPLE_ACCOUNTS: 'MULTIPLE_ACCOUNTS',
  
  /** When a new wallet is being added and needs to be aggregated */
  AGGREGATE_NEW: 'AGGREGATE_NEW',
} as const;

export type AuthModalTypeKeys = keyof typeof AuthModalType;

/**
 * Auth State Interface
 * 
 * Defines the structure of the authentication state that will be shared
 * between different authentication methods.
 */
export interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  modalType: AuthModalTypeKeys | null;
  userId: string;
  userGalaxyData: any | null; // TODO: Define proper type for Galaxy data
  telegramUser: boolean;
  walletDisconnected: boolean;
}

/**
 * Telegram Info Interface
 * 
 * Defines the structure of Telegram user information.
 */
export interface TelegramInfo {
  ID: number;
  Is_Bot: string;
  Username: string;
  First_Name: string;
  Last_Name: string;
  Is_Premium_User: string;
  Language: string;
  Added_to_Attachment_Menu: string;
  Allows_Write_to_PM: string;
}

/**
 * User Interface
 * 
 * Defines the structure of a user object in the system.
 */
export interface User {
  user_id: string;
  crypto_wallet_address: string | null;
  crypto_wallet_type?: string;
  telegram_info?: TelegramInfo[];
  telegram_id?: string;
  used_ref_code?: string;
  genereated_ref_code?: string;
  registration_date: string;
  last_login_date: string;
  is_tele_user?: boolean;
}

/**
 * Galaxy Blaster Instance Interface
 * 
 * Defines the structure of a Galaxy Blaster game instance.
 */
export interface GalaxyBlasterInstance {
  user_id: string;
  crypto_wallet_address: string | null;
  last_score: number;
  high_score: number;
  total_score: number;
  season_two_total_score: number;
  games_played: number;
  created_at: string;
  updated_at: string;
  tokens_collected: Array<{
    amount: number;
    coin_id: string;
    coin_name: string;
    image_url: string;
  }>;
  season_two_tokens_collected: Array<{
    amount: number;
    coin_id: string;
    coin_name: string;
    image_url: string;
  }>;
  points_by_click: number;
  referral_points_earned: number;
  aliens_threshold: number;
  total_aliens_killed: number;
}

/**
 * Profile Settings Interface
 * 
 * Defines the structure of user profile settings.
 */
export interface ProfileSettings {
  user_id: string;
  trade_style: string;
  wallets: any[]; // TODO: Define proper wallet type
  risk_profile: string;
  stop_loss: number;
  take_profit: number;
  trailing_stop: number;
  slippage: number;
  current_step: number;
}
