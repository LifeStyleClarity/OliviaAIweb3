import { OPENAI_MICROSERVICE_CONFIG, ENDPOINTS } from '../config/endpoints.js';

/**
 * OpenAI Microservice Client
 * Secure client for calling the OpenAI microservice REST endpoints
 */
export class OpenAIMicroserviceClient {
  constructor() {
    this.baseURL = OPENAI_MICROSERVICE_CONFIG.URL;
    this.token = OPENAI_MICROSERVICE_CONFIG.TOKEN;
  }

  /**
   * Get default headers for authenticated requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Origin': window.location.origin
    };

    // Add authentication token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make authenticated request to microservice
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('OpenAI Microservice request failed:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const data = await this.makeRequest(ENDPOINTS.OPENAI_MICROSERVICE.HEALTH);
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate chat completion using OpenAI
   */
  async chatCompletion(messages, options = {}) {
    try {
      const requestBody = {
        messages,
        model: options.model || 'gpt-3.5-turbo',
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7
      };

      const data = await this.makeRequest(ENDPOINTS.OPENAI_MICROSERVICE.CHAT_COMPLETIONS, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return data;
    } catch (error) {
      console.error('Chat completion failed:', error);
      throw error;
    }
  }

  /**
   * Extract trading parameters from natural language
   */
  async extractTradingParameters(input) {
    try {
      const requestBody = { input };

      const data = await this.makeRequest(ENDPOINTS.OPENAI_MICROSERVICE.EXTRACT_TRADING, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return data;
    } catch (error) {
      console.error('Trading parameter extraction failed:', error);
      throw error;
    }
  }

  /**
   * Get WebSocket statistics
   */
  async getWebSocketStats() {
    try {
      const data = await this.makeRequest(ENDPOINTS.OPENAI_MICROSERVICE.WEBSOCKET_STATS);
      return data;
    } catch (error) {
      console.error('WebSocket stats request failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if microservice is properly configured
   */
  isConfigured() {
    return !!(this.baseURL && this.token);
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      baseURL: this.baseURL,
      hasToken: !!this.token,
      isConfigured: this.isConfigured(),
      websocketURL: OPENAI_MICROSERVICE_CONFIG.WEBSOCKET_URL
    };
  }
}

// Export singleton instance
export const openaiMicroservice = new OpenAIMicroserviceClient();

// Export class for custom instances
export default OpenAIMicroserviceClient;
