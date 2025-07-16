// Tools Registry for Olivia AI
import { getCryptoPrice, getCryptoTrending, setCryptoAlert } from './crypto-tools';
import { getTwitterUser, getTwitterTrends, trackInfluencer } from './social-tools';
import { storeUserData, getUserContext, rememberPreference } from './memory-tools';

// Define all available tools
export const AVAILABLE_TOOLS = {
  // Crypto Tools
  getCryptoPrice: {
    name: 'getCryptoPrice',
    description: 'Get current price of a cryptocurrency',
    parameters: {
      symbol: { type: 'string', required: true, description: 'Crypto symbol (e.g., BTC, ETH)' }
    },
    handler: getCryptoPrice
  },
  
  getCryptoTrending: {
    name: 'getCryptoTrending',
    description: 'Get trending cryptocurrencies',
    parameters: {
      limit: { type: 'number', required: false, description: 'Number of results (default: 10)' }
    },
    handler: getCryptoTrending
  },
  
  setCryptoAlert: {
    name: 'setCryptoAlert',
    description: 'Set price alert for a cryptocurrency',
    parameters: {
      symbol: { type: 'string', required: true },
      targetPrice: { type: 'number', required: true },
      alertType: { type: 'string', required: true, enum: ['above', 'below'] }
    },
    handler: setCryptoAlert
  },
  
  // Social Media Tools
  getTwitterUser: {
    name: 'getTwitterUser',
    description: 'Get information about a Twitter user',
    parameters: {
      username: { type: 'string', required: true, description: 'Twitter username without @' }
    },
    handler: getTwitterUser
  },
  
  getTwitterTrends: {
    name: 'getTwitterTrends',
    description: 'Get current Twitter trends',
    parameters: {
      location: { type: 'string', required: false, description: 'Location for trends (default: worldwide)' }
    },
    handler: getTwitterTrends
  },
  
  trackInfluencer: {
    name: 'trackInfluencer',
    description: 'Start tracking a crypto influencer',
    parameters: {
      username: { type: 'string', required: true },
      platform: { type: 'string', required: true, enum: ['twitter', 'telegram'] }
    },
    handler: trackInfluencer
  },
  
  // Memory Tools
  storeUserData: {
    name: 'storeUserData',
    description: 'Store information about the user',
    parameters: {
      key: { type: 'string', required: true },
      value: { type: 'any', required: true }
    },
    handler: storeUserData
  },
  
  getUserContext: {
    name: 'getUserContext',
    description: 'Get stored user context and preferences',
    parameters: {},
    handler: getUserContext
  },
  
  rememberPreference: {
    name: 'rememberPreference',
    description: 'Remember user preference for future interactions',
    parameters: {
      preference: { type: 'string', required: true },
      value: { type: 'any', required: true }
    },
    handler: rememberPreference
  }
};

// Tool execution function
export async function executeTool(toolName, parameters, userContext) {
  const tool = AVAILABLE_TOOLS[toolName];
  
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  
  try {
    console.log(`🔧 Executing tool: ${toolName}`, parameters);
    const result = await tool.handler(parameters, userContext);
    
    return {
      success: true,
      toolName,
      parameters,
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Tool execution failed: ${toolName}`, error);
    
    return {
      success: false,
      toolName,
      parameters,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Get available tools list for AI
export function getAvailableTools() {
  return Object.keys(AVAILABLE_TOOLS).map(key => ({
    name: key,
    description: AVAILABLE_TOOLS[key].description,
    parameters: AVAILABLE_TOOLS[key].parameters
  }));
} 