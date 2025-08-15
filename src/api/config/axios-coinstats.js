import axios from 'axios';

const COINSTATS_BASE_URL = 'https://openapiv1.coinstats.app';
const COINSTATS_API_KEY = '9Klzg9z+3MF79XvCZ9lql5yqPKC9G2q16OOyXuwEjn0=';

const axiosCoinstats = axios.create({
  baseURL: COINSTATS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': COINSTATS_API_KEY,
  },
});

// Debug log requests in dev
axiosCoinstats.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log('[CoinStats] Request:', {
      url: (config.baseURL || '') + (config.url || ''),
      method: config.method,
    });
  }
  return config;
});

axiosCoinstats.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('[CoinStats] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[CoinStats] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default axiosCoinstats;