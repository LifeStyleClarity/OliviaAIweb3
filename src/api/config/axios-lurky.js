import axios from 'axios';

const LURKY_BASE_URL = import.meta.env.DEV ? '/lurky' : (import.meta.env.VITE_LURKY_API_BASE_URL || 'https://api.lurky.app');
// Hardcoded fallback key for development if env var is missing
const LURKY_API_KEY = import.meta.env.VITE_LURKY_API_KEY || '4xxIvRdkAhVISB6nKzUGclWVQnh-oVymYw3VNDrtdeg';

const axiosInstanceLurky = axios.create({
  baseURL: LURKY_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-lurky-api-key': LURKY_API_KEY
  }
});

// Debug log requests in dev
axiosInstanceLurky.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log('[Lurky] Request:', {
      url: (config.baseURL || '') + (config.url || ''),
      method: config.method,
      headers: config.headers
    });
  }
  return config;
});

axiosInstanceLurky.interceptors.response.use(
  (response) => response,
  (error) => {
    // Surface rate limit info if present
    const rateLimit = {
      limit: error?.response?.headers?.['x-ratelimit-limit'],
      remaining: error?.response?.headers?.['x-ratelimit-remaining'],
      reset: error?.response?.headers?.['x-ratelimit-reset']
    };
    if (rateLimit.limit) {
      // Attach metadata for callers to optionally read
      error.rateLimit = rateLimit;
    }
    if (import.meta.env.DEV) {
      console.error('[Lurky] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstanceLurky;

