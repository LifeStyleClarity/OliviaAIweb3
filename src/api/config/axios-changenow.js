import axios from 'axios';

const CHANGENOW_BASE_URL = 'https://api.changenow.io/v1';
const CHANGENOW_API_KEY = 'bdca7512f7911b7c82546d81a750bbff5b70954a2cf5e8de5c2fff08e30e41c4';

const axiosChangeNow = axios.create({
  baseURL: CHANGENOW_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosChangeNow.interceptors.request.use((config) => {
  // For v1, add API key as query parameter instead of header
  config.params = {
    ...config.params,
    api_key: CHANGENOW_API_KEY,
  };

  if (import.meta.env.DEV) {
    console.log('[ChangeNOW] Request:', {
      url: (config.baseURL || '') + (config.url || ''),
      method: config.method,
      headers: config.headers,
    });
  }
  return config;
});

axiosChangeNow.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('[ChangeNOW] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[ChangeNOW] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default axiosChangeNow;
