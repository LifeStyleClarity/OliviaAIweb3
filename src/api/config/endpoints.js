const WS_BASE_URL = import.meta.env.VITE_WEBSOCKET_URL;
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL;
const API_GATEWAY_TON_URL = import.meta.env.VITE_API_GATEWAY_TON_URL;
export const API_GATEWAY_JWT = import.meta.env.VITE_API_GATEWAY_JWT;

export const ENDPOINTS = {
    WEBSOCKET: {
        CHAT: `${WS_BASE_URL}/ws/chat`,
        AGENT_CHAT: `${WS_BASE_URL}/ws/chat/agents`,
        AUDIO: `${WS_BASE_URL}/ws/audio`,
        GET_INTRO_MESSAGE: `${WS_BASE_URL}/ws/intro-message`,
    },
    TOKENS: {
        GET_BY_ADDRESS: `${API_GATEWAY_URL}/tokens/by-token-address/:token_address`,
    },
    CHAT: {
        GET_CHAT_HISTORY: `${API_GATEWAY_URL}/users/chat-data/:id`,
        UPDATE_CHAT_HISTORY: `${API_GATEWAY_URL}/users/chat-data/:id`
    },
    PORTFOLIO: {
        GET_PORTFOLIO: `${API_GATEWAY_TON_URL}/get-portfolio`,
    },
    SOCIAL: {
        GET_INFLUENCERS: `${API_GATEWAY_URL}/cashtags/influencers`,
        GET_INFLUENCER_BY_ID: `${API_GATEWAY_URL}/influencers_bens_list/:id`,
        UPDATE_INFLUENCER_BY_ID: `${API_GATEWAY_URL}/influencers_bens_list/:id`,
        GET_TOKENS: `${API_GATEWAY_URL}/tokens`,
        GET_MENTIONS: `${API_GATEWAY_URL}/cashtags/mentions`
    },
    TRADING: {
        CREATE_TRADE: `${API_GATEWAY_URL}/trades`,
        UPDATE_TRADE: `${API_GATEWAY_URL}/trades/:id`,
        GET_USER_TRADES: `${API_GATEWAY_URL}/trades/user/:id`,
        GET_TRADE: `${API_GATEWAY_URL}/trades/:id`,
        DELETE_TRADE: `${API_GATEWAY_URL}/trades/:id`,
        CREATE_TRANSACTIONS: `${API_GATEWAY_URL}/transactions`
    },
    NOTIFICATIONS: {
        GET_USER_NOTIFICATIONS: `${API_GATEWAY_URL}/notifications/user/:id`,
        MARK_ALL_READ: `${API_GATEWAY_URL}/notifications/user/:id/mark-read`,
        UPDATE_NOTIFICATION: `${API_GATEWAY_URL}/notifications/:id`,
        DELETE_NOTIFICATION: `${API_GATEWAY_URL}/notifications/:id`
    },
    PROFILE_SETTINGS: {
        GET_USER_SETTINGS: `${API_GATEWAY_URL}/profile_settings/user/:id`,
        CREATE_SETTINGS: `${API_GATEWAY_URL}/profile_settings`,
        UPDATE_SETTINGS: `${API_GATEWAY_URL}/profile_settings/user/:id`
    },
    AIRDROP: {
        UPDATE_AIRDROP_WALLET: `${API_GATEWAY_URL}/users_claimed/:tg_id`,
        GET_USER_AIRDROP: `${API_GATEWAY_URL}/users/points/:id`
    },
    USER: {
        CREATE_USER: `${API_GATEWAY_URL}/users`,
        CHECK_USER: `${API_GATEWAY_URL}/users/check`,
        UPDATE_USER: `${API_GATEWAY_URL}/users/:id`,

        GET_USER_BY_TG_ID: `${API_GATEWAY_URL}/users/Idtelegram/v2/:tg_id`,
        GET_USER_BY_WALLET: `${API_GATEWAY_URL}/users/wallet/:walletAddress`,

        AGGREGATE_WALLETS: `${API_GATEWAY_URL}/users/aggregate/:id`,
        CHANGE_USER_WALLET: `${API_GATEWAY_URL}/users/change_wallet/:id/:walletAddress/:walletType`,

        CHECK_GALAXY_INSTANCE: `${API_GATEWAY_URL}/galaxy_blaster/:id`,
        CREATE_GALAXY_INSTANCE: `${API_GATEWAY_URL}/galaxy_blaster`,
        UPDATE_GALAXY_INSTANCE: `${API_GATEWAY_URL}/galaxy_blaster/:id`,

        CHECK_PROFILE_SETTINGS: `${API_GATEWAY_URL}/profile_settings/user/:id`,
        CREATE_PROFILE_SETTINGS: `${API_GATEWAY_URL}/profile_settings`,
    },
    NFT: {
        GET_NFT: `${API_GATEWAY_URL}/nft/get_nfts/:walletAddress`,
    },
    TRANSACTION: {
        GET_TX_PARAMS_V2: `${API_GATEWAY_TON_URL}/get-txparams-v2`,
        GET_TX_PARAMS_SPECIFIC_SELL: `${API_GATEWAY_TON_URL}/get-txparams-specific-sell`,
        VERIFY_TRANSACTION: `${API_GATEWAY_TON_URL}/verify-transaction`,
        BUY_TON_CREDIT_CARD: `https://api.changenow.io/v2/fiat-transaction`
    }
};

export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};
