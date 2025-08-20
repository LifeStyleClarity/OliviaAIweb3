import axios from 'axios';
import { config } from '../config/config.js';

// ChangeNOW API Configuration
const CHANGENOW_BASE_URL = 'https://api.changenow.io/v1';

// Create axios instance for ChangeNOW
const changeNowAxios = axios.create({
  baseURL: CHANGENOW_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add API key
changeNowAxios.interceptors.request.use((requestConfig) => {
  // For v1, add API key as query parameter
  requestConfig.params = {
    ...requestConfig.params,
    api_key: config.changeNowApiKey,
  };

  if (config.nodeEnv === 'development') {
    console.log('[ChangeNOW] Request:', {
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      method: requestConfig.method,
      headers: requestConfig.headers,
    });
  }
  return requestConfig;
});

// Response interceptor for logging
changeNowAxios.interceptors.response.use(
  (response) => {
    if (config.nodeEnv === 'development') {
      console.log('[ChangeNOW] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (config.nodeEnv === 'development') {
      console.error('[ChangeNOW] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

/**
 * ChangeNOW Controller class
 */
export class ChangeNowController {
  
  /**
   * Get list of available currencies
   */
  static async getCurrencies(req, res) {
    try {
      const { active = true } = req.query;
      
      const response = await changeNowAxios.get('/currencies', {
        params: { active }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ChangeNOW getCurrencies error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch currencies',
        code: 'CHANGENOW_CURRENCIES_ERROR'
      });
    }
  }

  /**
   * Get exchange amount estimate
   */
  static async getExchangeAmount(req, res) {
    try {
      const { from, to, amount } = req.query;

      // Validate required parameters
      if (!from || !to || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to, amount',
          code: 'MISSING_PARAMETERS'
        });
      }

      const response = await changeNowAxios.get('/exchange-amount', {
        params: { from, to, amount }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ChangeNOW getExchangeAmount error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get exchange amount',
        code: 'CHANGENOW_EXCHANGE_AMOUNT_ERROR'
      });
    }
  }

  /**
   * Get minimum exchange amount
   */
  static async getMinAmount(req, res) {
    try {
      const { from, to } = req.query;

      // Validate required parameters
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to',
          code: 'MISSING_PARAMETERS'
        });
      }

      const response = await changeNowAxios.get('/min-amount', {
        params: { from, to }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ChangeNOW getMinAmount error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get minimum amount',
        code: 'CHANGENOW_MIN_AMOUNT_ERROR'
      });
    }
  }

  /**
   * Create new exchange transaction
   */
  static async createTransaction(req, res) {
    try {
      const { from, to, amount, address, extraId, refundAddress } = req.body;

      // Validate required parameters
      if (!from || !to || !amount || !address) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to, amount, address',
          code: 'MISSING_PARAMETERS'
        });
      }

      const transactionData = {
        from,
        to,
        amount,
        address,
        ...(extraId && { extraId }),
        ...(refundAddress && { refundAddress })
      };

      const response = await changeNowAxios.post('/transactions', transactionData);

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ChangeNOW createTransaction error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create transaction',
        code: 'CHANGENOW_CREATE_TRANSACTION_ERROR'
      });
    }
  }

  /**
   * Get transaction status
   */
  static async getTransactionStatus(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID is required',
          code: 'MISSING_TRANSACTION_ID'
        });
      }

      const response = await changeNowAxios.get(`/transactions/${id}`);

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ChangeNOW getTransactionStatus error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get transaction status',
        code: 'CHANGENOW_TRANSACTION_STATUS_ERROR'
      });
    }
  }

  /**
   * Get exchange rate for a currency pair
   */
  static async getExchangeRate(req, res) {
    try {
      const { from, to } = req.query;

      // Validate required parameters
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to',
          code: 'MISSING_PARAMETERS'
        });
      }

      const response = await changeNowAxios.get('/exchange-range', {
        params: { from, to }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ChangeNOW getExchangeRate error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get exchange rate',
        code: 'CHANGENOW_EXCHANGE_RATE_ERROR'
      });
    }
  }
}
