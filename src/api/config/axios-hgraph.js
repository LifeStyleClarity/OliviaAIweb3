import axios from 'axios';

const HGRAPH_BASE_URL = 'https://mainnet-public.mirrornode.hedera.com/api/v1';
const HGRAPH_API_KEY = import.meta.env.VITE_HGRAPH_API_KEY || ''; // Optional - has free tier

const axiosHgraph = axios.create({
  baseURL: HGRAPH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(HGRAPH_API_KEY && { 'X-API-KEY': HGRAPH_API_KEY })
  },
});

// Request interceptor
axiosHgraph.interceptors.request.use(
  (config) => {
    console.log('🟣 Hgraph API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('🔴 Hgraph Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosHgraph.interceptors.response.use(
  (response) => {
    console.log('🟢 Hgraph API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🔴 Hgraph API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default axiosHgraph;
