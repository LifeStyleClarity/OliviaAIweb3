import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const axiosCoingecko = axios.create({
  baseURL: COINGECKO_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug log requests in dev
axiosCoingecko.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log('[CoinGecko] Request:', {
      url: (config.baseURL || '') + (config.url || ''),
      method: config.method,
    });
  }
  return config;
});

axiosCoingecko.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('[CoinGecko] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[CoinGecko] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default axiosCoingecko;
