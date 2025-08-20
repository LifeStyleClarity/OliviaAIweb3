import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

export const changeNowService = {
  // Get list of all available currencies
  async getCurrencies() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/changenow/currencies?active=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { result: data.success ? data.data : data };
    } catch (error) {
      console.error('ChangeNOW currencies fetch error:', error);
      throw error;
    }
  },

  // Get minimum exchange amount for a currency pair
  async getMinimalExchange(fromCurrency, toCurrency) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/changenow/min-amount?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('ChangeNOW minimal exchange error:', error);
      throw error;
    }
  },

  // Get exchange amount estimate
  async getExchangeAmount(fromCurrency, toCurrency, amount) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/changenow/exchange-amount?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${amount}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('ChangeNOW exchange amount error:', error);
      throw error;
    }
  },

  // Get exchange range (min and max limits)  
  async getExchangeRange(fromCurrency, toCurrency) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/changenow/exchange-rate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('ChangeNOW exchange range error:', error);
      throw error;
    }
  },

  // Get market info for available pairs
  async getMarketInfo(fromCurrency, toCurrency) {
    try {
      // Use currencies endpoint to get basic info 
      const currencies = await this.getCurrencies();
      
      // Find the currencies in the list
      const fromCurrencyInfo = currencies.result.find(c => c.ticker.toLowerCase() === fromCurrency.toLowerCase());
      const toCurrencyInfo = currencies.result.find(c => c.ticker.toLowerCase() === toCurrency.toLowerCase());
      
      return {
        fromCurrency: fromCurrencyInfo,
        toCurrency: toCurrencyInfo,
        flow: 'standard'
      };
    } catch (error) {
      console.error('ChangeNOW market info error:', error);
      throw error;
    }
  },

  // Search for a specific currency
  async searchCurrency(query) {
    try {
      const currencies = await this.getCurrencies();
      const searchQuery = query.toLowerCase();
      
      // Find currencies that match the search query
      const matches = currencies.result.filter(currency => 
        currency.ticker.toLowerCase() === searchQuery ||
        currency.name.toLowerCase().includes(searchQuery)
      );

      return { result: matches };
    } catch (error) {
      console.error('ChangeNOW currency search error:', error);
      throw error;
    }
  },

  // Get comprehensive exchange info for a token pair
  async getExchangeInfo(fromToken, toToken = 'usdt', amount = 1) {
    try {
      // First, search for the currencies to get proper tickers
      const fromSearch = await this.searchCurrency(fromToken);
      const toSearch = await this.searchCurrency(toToken);

      if (!fromSearch.result.length) {
        throw new Error(`Token "${fromToken}" not found`);
      }
      if (!toSearch.result.length) {
        throw new Error(`Token "${toToken}" not found`);
      }

      const fromCurrency = fromSearch.result[0];
      const toCurrency = toSearch.result[0];

      // Get all the exchange data
      const [minAmount, exchangeAmount, exchangeRange, marketInfo] = await Promise.allSettled([
        this.getMinimalExchange(fromCurrency.ticker, toCurrency.ticker),
        this.getExchangeAmount(fromCurrency.ticker, toCurrency.ticker, amount),
        this.getExchangeRange(fromCurrency.ticker, toCurrency.ticker),
        this.getMarketInfo(fromCurrency.ticker, toCurrency.ticker)
      ]);

      return {
        fromCurrency,
        toCurrency,
        minAmount: minAmount.status === 'fulfilled' ? minAmount.value : null,
        exchangeAmount: exchangeAmount.status === 'fulfilled' ? exchangeAmount.value : null,
        exchangeRange: exchangeRange.status === 'fulfilled' ? exchangeRange.value : null,
        marketInfo: marketInfo.status === 'fulfilled' ? marketInfo.value : null
      };
    } catch (error) {
      console.error('ChangeNOW exchange info error:', error);
      throw error;
    }
  },

  // Create new exchange transaction
  async createTransaction(transactionData) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/changenow/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('ChangeNOW createTransaction error:', error);
      throw error;
    }
  },

  // Get transaction status
  async getTransactionStatus(transactionId) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/changenow/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('ChangeNOW getTransactionStatus error:', error);
      throw error;
    }
  }
};