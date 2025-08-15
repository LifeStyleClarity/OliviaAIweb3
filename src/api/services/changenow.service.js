import axiosChangeNow from '../config/axios-changenow';

export const changeNowService = {
  // Get list of all available currencies
  async getCurrencies() {
    try {
      const { data } = await axiosChangeNow.get('/exchange/currencies');
      return { result: data };
    } catch (error) {
      console.error('ChangeNOW currencies fetch error:', error);
      throw error;
    }
  },

  // Get minimum exchange amount for a currency pair
  async getMinimalExchange(fromCurrency, toCurrency) {
    try {
      const { data } = await axiosChangeNow.get('/exchange/min-amount', {
        params: {
          fromCurrency: fromCurrency.toLowerCase(),
          toCurrency: toCurrency.toLowerCase()
        }
      });
      return data;
    } catch (error) {
      console.error('ChangeNOW minimal exchange error:', error);
      throw error;
    }
  },

  // Get exchange amount estimate
  async getExchangeAmount(fromCurrency, toCurrency, amount) {
    try {
      const { data } = await axiosChangeNow.get('/exchange/estimated-amount', {
        params: {
          fromCurrency: fromCurrency.toLowerCase(),
          toCurrency: toCurrency.toLowerCase(),
          fromAmount: amount,
          flow: 'standard'
        }
      });
      return data;
    } catch (error) {
      console.error('ChangeNOW exchange amount error:', error);
      throw error;
    }
  },

  // Get exchange range (min and max limits)
  async getExchangeRange(fromCurrency, toCurrency) {
    try {
      const { data } = await axiosChangeNow.get('/exchange/range', {
        params: {
          fromCurrency: fromCurrency.toLowerCase(),
          toCurrency: toCurrency.toLowerCase(),
          flow: 'standard'
        }
      });
      return data;
    } catch (error) {
      console.error('ChangeNOW exchange range error:', error);
      throw error;
    }
  },

  // Get market info for available pairs
  async getMarketInfo(fromCurrency, toCurrency) {
    try {
      // Use currencies endpoint to get basic info since market-info might not exist in v2
      const { data } = await axiosChangeNow.get('/exchange/currencies', {
        params: {
          active: true
        }
      });
      
      // Find the currencies in the list
      const fromCurrencyInfo = data.find(c => c.ticker.toLowerCase() === fromCurrency.toLowerCase());
      const toCurrencyInfo = data.find(c => c.ticker.toLowerCase() === toCurrency.toLowerCase());
      
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
  }
};
