import { toUserFriendlyAddress } from "@tonconnect/ui-react";

/**
 * Generates a referral code using wallet address or telegram ID
 * @param {string} identifier - Wallet address or telegram ID to generate code from
 * @returns {string} Generated referral code
 */
export const generateRefCode = (identifier) => {
  const lastFourDigits = identifier.slice(-4);
  const timestamp = Date.now().toString().slice(-6); // Get the last 6 digits of the timestamp
  return lastFourDigits + timestamp;
};

/**
 * Converts a raw TON address to a user-friendly format
 * @param {string} rawAddress - Raw TON address
 * @returns {string} User-friendly address
 */
export const convertAddress = (rawAddress) => {
  return toUserFriendlyAddress(rawAddress);
};

/**
 * Shortens a public key/address for display
 * @param {string} key - Public key or address to shorten
 * @returns {string} Shortened key with format "first4...last4"
 */
export const shortenPublicKey = (key) => {
  if (!key) return "";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

/**
 * Extracts Telegram user information from the Telegram WebApp
 * @returns {Object|null} Telegram user info or null if not in Telegram environment
 */
export const getTelegramUserInfo = () => {
  //console.log('🔍 Checking for Telegram environment...');

  // Check if we're in Telegram environment
  const hasTelegram = !!window.Telegram;
  const hasWebApp = !!(window.Telegram?.WebApp);
  const hasInitData = !!(window.Telegram?.WebApp?.initDataUnsafe && window.Telegram?.WebApp?.initData);

  // console.log('📱 Telegram environment check:', {
  //   hasTelegram,
  //   hasWebApp,
  //   hasInitData,
  //   window: {
  //     Telegram: !!window.Telegram,
  //     WebApp: !!window.Telegram?.WebApp,
  //     initDataUnsafe: !!window.Telegram?.WebApp?.initDataUnsafe,
  //     initData: !!window.Telegram?.WebApp?.initData
  //   }
  // });

  if (hasTelegram && hasWebApp && hasInitData) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    const user = tg.initDataUnsafe.user;

    if (user) {
      //console.log('✅ Found Telegram user:', user);
      const telegramData = {
        telegramId: user.id,
        telegramInfo: [{
          ID: user.id,
          Is_Bot: user.is_bot ? "Yes" : "No",
          Username: user.username,
          First_Name: user.first_name,
          Last_Name: user.last_name,
          Is_Premium_User: user.is_premium ? "Yes" : "No",
          Language: user.language_code,
          Added_to_Attachment_Menu: user.added_to_attachment_menu ? "Yes" : "No",
          Allows_Write_to_PM: user.allows_write_to_pm ? "Yes" : "No"
        }]
      };
      //console.log('📦 Formatted Telegram data:', telegramData);
      return telegramData;
    } else {
      console.log('⚠️ No user data in Telegram WebApp ');
    }
  } else {
    const telegramData =
    {
      telegramId: 952080226,
      telegramInfo: [{
        ID: 952080226,
        Is_Bot: "No",
        Username: "Ed_Ai_dev",
        First_Name: "Eduardo",
        Last_Name: "Brito",
        Is_Premium_User: "No",
        Language: "en",
        Added_to_Attachment_Menu: "No",
        Allows_Write_to_PM: "No"
      }]
    }
    //console.log('⚠️ No user data in Telegram WebApp using ED DUMMY DATA');
    return telegramData;
    // console.log('⚠️ Not in Telegram environment or missing required data');
  }
  return null;
};

/**
 * Gets the referral code from URL parameters
 * @returns {string|null} Referral code if present in URL, null otherwise
 */
export const getReferralCodeFromURL = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get("referral_code") || null;
};

/**
 * Validates a wallet address
 * @param {string} address - Wallet address to validate
 * @returns {boolean} Whether the address is valid
 */
export const isValidWalletAddress = (address) => {
  // Basic validation - should be enhanced based on specific requirements
  return typeof address === 'string' && address.length > 0;
};

/**
 * Creates an error object with standardized format
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @returns {Error} Formatted error object
 */
export const createAuthError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

/**
 * Checks if the current environment is the Telegram WebApp
 * @returns {boolean} Whether the current environment is Telegram WebApp
 */
export const isTelegramWebApp = () => {
  return !!(
    window.Telegram &&
    window.Telegram.WebApp &&
    window.Telegram.WebApp.initDataUnsafe
  );
};
