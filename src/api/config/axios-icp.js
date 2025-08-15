import axios from 'axios';

// ICP Dashboard API - free public endpoints
const ICP_BASE_URL = 'https://ic-api.internetcomputer.org/api/v3';

const axiosICP = axios.create({
  baseURL: ICP_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug log requests in dev
axiosICP.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log('[ICP] Request:', {
      url: (config.baseURL || '') + (config.url || ''),
      method: config.method,
    });
  }
  return config;
});

axiosICP.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('[ICP] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[ICP] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default axiosICP;
