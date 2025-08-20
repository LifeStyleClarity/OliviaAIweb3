import { ENDPOINTS } from '../config/endpoints.js';
import axiosInstanceAPIGateway from '../config/axios-gateway.js';

export const checkUserExists = async (walletAddress) => {
  try {
    const response = await axiosInstanceAPIGateway.get(ENDPOINTS.USER.GET_USER_BY_WALLET.replace(":walletAddress", walletAddress));
    //console.log('✅ API Response:', {
    //   status: response.success,
    //   data: response.data
    // });
    //console.log("response:", response);
    return response.data.data;
    // if (location.pathname === '/login') {
    // } else if (location.pathname === '/') {
    //   return response.data;
    // }
  } catch (error) {
    console.error('❌ API Error:', {
      status: error.response?.success,
      data: error.response?.data.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getAllUsersTelegramId = async (telegramId) => {

  try {
    const response = await axiosInstanceAPIGateway.get(ENDPOINTS.USER.GET_USER_BY_TG_ID.replace(":tg_id", telegramId));
    //console.log('✅ Found Telegram users:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting Telegram users:', {
      status: error.response?.success,
      data: error.response?.data.data,
      message: error.message
    });
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    //console.log("userId under update user from Auth.service: ", userId)
    const response = await axiosInstanceAPIGateway.put(ENDPOINTS.USER.UPDATE_USER.replace(":id", userId), updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const createUser = async (user) => {
  try {
    const response = await axiosInstanceAPIGateway.post(ENDPOINTS.USER.CREATE_USER, user);
    //console.log("created user:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const aggregateUsers = async (userId) => {
  try {
    const response = await axiosInstanceAPIGateway.get(ENDPOINTS.USER.AGGREGATE_WALLETS.replace(":id", userId));
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const walletChange = async (userId, wallet, walletType) => {
  try {
    const response = await axiosInstanceAPIGateway.get(ENDPOINTS.USER.CHANGE_USER_WALLET.replace(":id", userId).replace(":walletAddress", wallet).replace(":walletType", walletType));
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const checkGalaxyBlasterInstance = async (userId) => {
  try {
    const response = await axiosInstanceAPIGateway.get(ENDPOINTS.USER.CHECK_GALAXY_INSTANCE.replace(":id", userId));
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createGalaxyBlasterInstance = async (newInstance) => {
  try {
    const response = await axiosInstanceAPIGateway.post(ENDPOINTS.USER.CREATE_GALAXY_INSTANCE, newInstance);
    return response.data.data;
  } catch (error) {
    console.error('Error creating galaxy instance:', error);
    throw error;
  }
};

export const updateGalaxyBlasterInstance = async (userId, walletAddress) => {
  try {

    const response = await axiosInstanceAPIGateway.put(ENDPOINTS.USER.UPDATE_GALAXY_INSTANCE.replace(":id", userId), {
      updated_at: new Date().toISOString(),
      crypto_wallet_address: walletAddress,
    });

    return response.data.data;
  } catch (error) {
    console.error('Error updating galaxy instance:', error);
    throw error;
  }
};

export const updateGalaxyBlasterInstanceGamesPlayed = async (userId, currentGamesPlayed) => {
  try {

    const response = await axiosInstanceAPIGateway.put(ENDPOINTS.USER.UPDATE_GALAXY_INSTANCE.replace(":id", userId), {
      updated_at: new Date().toISOString(),
      games_played: currentGamesPlayed + 1,
    });

    return response.data.data;
  } catch (error) {
    console.error('Error updating galaxy instance:', error);
    throw error;
  }
};

export const updateGalaxyBlasterScores = async (userId, score, highScore, totalScore, coinsCollected, newReferralPoints, aliensKilled, shipUpgrade) => {
  try {

    const response = await axiosInstanceAPIGateway.put(ENDPOINTS.USER.UPDATE_GALAXY_INSTANCE.replace(":id", userId), {
      last_score: score,
      high_score: highScore,
      season_two_total_score: totalScore,
      updated_at: new Date().toISOString(),
      season_two_tokens_collected: coinsCollected,
      referral_points_earned: newReferralPoints,
      total_aliens_killed: aliensKilled,
      ship_upgrades: shipUpgrade
    });

    return response.data.data;
  } catch (error) {
    console.error('Error updating galaxy instance:', error);
    throw error;
  }
};

export const checkUserProfileSettingsExists = async (userId) => {
  try {
    const response = await axiosInstanceAPIGateway.get(ENDPOINTS.USER.CHECK_PROFILE_SETTINGS.replace(":id", userId));
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createProfileSettingsUser = async (settingsData) => {
  try {
    const response = await axiosInstanceAPIGateway.post(ENDPOINTS.USER.CREATE_PROFILE_SETTINGS, settingsData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating profile settings:', error);
    throw error;
  }
};

// Airdrop functionality removed - endpoint deprecated
export const airdropWalletUpdate = async (telegram_id, updateData) => {
  console.warn('Airdrop functionality has been deprecated');
  return { success: false, message: 'Airdrop functionality deprecated' };
};

export const createDefaultGalaxyInstance = (userId, walletAddress) => ({
  user_id: userId,
  crypto_wallet_address: walletAddress,
  last_score: 0,
  high_score: 0,
  total_score: 0,
  season_two_total_score: 0,
  games_played: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tokens_collected: [
    {
      amount: 0,
      coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
      coin_name: "ONAI",
      image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
    },
    {
      amount: 0,
      coin_id: "b314e305-f678-4572-a10c-fba28990d4c3",
      coin_name: "TONAI",
      image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/TONAI_COIN.gif",
    },
    {
      amount: 0,
      coin_id: "cec39e92-6c8d-4ba1-a33c-b5951066ba22",
      coin_name: "SENTAI",
      image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/SENTAI_COIN.gif?t=2024-07-08T15%3A48%3A25.095Z",
    },
  ],
  season_two_tokens_collected: [
    {
      amount: 0,
      coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
      coin_name: "ONAI",
      image_url: "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
    },
  ],
  points_by_click: 0,
  referral_points_earned: 0,
  aliens_threshold: 50,
  total_aliens_killed: 0,
});

export const createDefaultProfileSettings = (userId) => ({
  user_id: userId,
  trade_style: "Manual",
  wallets: [],
  risk_profile: "Low",
  stop_loss: 0.2,
  take_profit: 0.2,
  trailing_stop: 0.2,
  slippage: 0.1,
  current_step: 1,
});
