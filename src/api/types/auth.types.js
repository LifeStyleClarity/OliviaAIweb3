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
};
