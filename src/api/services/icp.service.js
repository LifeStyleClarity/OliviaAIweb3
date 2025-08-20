import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { log, error } from '../../utils/logger.js';

// Canister ID from your deployment
const CANISTER_ID = import.meta.env.VITE_ICP_CANISTER_ID || 'umunu-kh777-77774-qaaca-cai';

// Local development host
const HOST = 'http://localhost:4943';

// IDL factory for the canister interface
const idlFactory = ({ IDL }) => {
  const User = IDL.Record({
    'id' : IDL.Principal,
    'firstName' : IDL.Text,
    'lastName' : IDL.Text,
    'email' : IDL.Text,
    'telegramId' : IDL.Opt(IDL.Text),
    'walletAddress' : IDL.Opt(IDL.Text),
    'isGuest' : IDL.Bool,
    'createdAt' : IDL.Int,
  });

  const ChatMessage = IDL.Record({
    'id' : IDL.Text,
    'userId' : IDL.Principal,
    'userMessage' : IDL.Text,
    'aiResponse' : IDL.Text,
    'timestamp' : IDL.Int,
    'conversationId' : IDL.Text,
    'metadata' : IDL.Record({
      'searchEnabled' : IDL.Bool,
      'imageEnabled' : IDL.Bool,
    }),
  });

  const UserProfile = IDL.Record({
    'id' : IDL.Principal,
    'displayName' : IDL.Text,
    'preferences' : IDL.Record({
      'theme' : IDL.Text,
      'notifications' : IDL.Bool,
    }),
  });

  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : ChatMessage, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Vec(ChatMessage), 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : UserProfile, 'err' : IDL.Text });

  return IDL.Service({
    'createUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [Result_1], []),
    'createGuestUser' : IDL.Func([], [Result_1], []),
    'getUser' : IDL.Func([], [Result_1], []),
    'saveMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Bool], [Result_2], []),
    'getUserMessages' : IDL.Func([], [Result_3], []),
    'getConversationMessages' : IDL.Func([IDL.Text], [Result_3], []),
    'searchMessages' : IDL.Func([IDL.Text], [Result_3], []),
    'createProfile' : IDL.Func([IDL.Text, IDL.Text, IDL.Bool], [Result_4], []),
    'getProfile' : IDL.Func([], [Result_4], []),
    'getMessageCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserCount' : IDL.Func([], [IDL.Nat], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
  });
};

let agent = null;
let actor = null;

const createAgent = async (identity = null) => {
  // Always create a new agent if we have a specific identity
  if (identity || !agent) {
    try {
      const agentOptions = { host: HOST };
      
      // Use provided identity if available (Internet Identity)
      if (identity) {
        agentOptions.identity = identity;
        log('🟦 Creating ICP Agent with Internet Identity');
      } else {
        log('🟦 Creating ICP Agent with anonymous identity');
      }
      
      const newAgent = new HttpAgent(agentOptions);
      
      // In development, fetch the root key (with timeout to prevent hanging)
      if (import.meta.env.DEV) {
        const rootKeyPromise = newAgent.fetchRootKey();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Root key fetch timeout')), 2000);
        });
        
        try {
          await Promise.race([rootKeyPromise, timeoutPromise]);
        } catch (error) {
          // Silently fail in development if root key fetch times out
          throw new Error('ICP network not available (development mode)');
        }
      }
      
      // Update the global agent reference
      if (identity) {
        agent = newAgent; // Store authenticated agent
      } else if (!agent) {
        agent = newAgent; // Store anonymous agent only if none exists
      }
      
      log('🟦 ICP Agent created successfully');
      return newAgent;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('🟦 ICP agent connection failed (development mode):', error.message);
      } else {
        error('🟦 Failed to create ICP agent:', error);
      }
      throw error;
    }
  }
  return agent;
};

const createActor = async (identity = null) => {
  // Always create a new actor if we have a specific identity
  if (identity || !actor) {
    const agentInstance = await createAgent(identity);
    const newActor = Actor.createActor(idlFactory, {
      agent: agentInstance,
      canisterId: CANISTER_ID,
    });
    
    // Update global actor reference
    if (identity) {
      actor = newActor; // Store authenticated actor
    } else if (!actor) {
      actor = newActor; // Store anonymous actor only if none exists
    }
    
    return newActor;
  }
  return actor;
};

export const icpService = {
  // Set Internet Identity for authenticated operations
  setIdentity(identity) {
    // Reset agent and actor to force recreation with new identity
    agent = null;
    actor = null;
    this._currentIdentity = identity;
    log('🟦 Internet Identity set for ICP service');
  },

  // Test connection
  async testConnection() {
    // Skip ICP connection in development mode if no local network is running
    if (import.meta.env.DEV) {
      try {
        const actorInstance = await createActor(this._currentIdentity);
        const result = await actorInstance.greet('Frontend');
        return { success: true, message: result };
      } catch (error) {
        console.warn('🟦 ICP connection test failed (development mode - this is normal):', error.message);
        return { success: false, error: error.message, skipRetry: true };
      }
    }
    
    try {
      const actorInstance = await createActor(this._currentIdentity);
      const result = await actorInstance.greet('Frontend');
      return { success: true, message: result };
    } catch (error) {
      error('ICP connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // User management
  async createUser(firstName, lastName, email, telegramId = null, walletAddress = null) {
    try {
      const actorInstance = await createActor(this._currentIdentity);
      const result = await actorInstance.createUser(firstName, lastName, email, telegramId ? [telegramId] : [], walletAddress ? [walletAddress] : []);
      
      if ('ok' in result) {
        return { success: true, user: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('Create user failed:', error);
      return { success: false, error: error.message };
    }
  },

  async createGuestUser() {
    try {
      const actorInstance = await createActor(this._currentIdentity);
      const result = await actorInstance.createGuestUser();
      
      if ('ok' in result) {
        return { success: true, user: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('Create guest user failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getUser() {
    try {
      const actorInstance = await createActor(this._currentIdentity);
      const result = await actorInstance.getUser();
      
      if ('ok' in result) {
        return { success: true, user: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('Get user failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Chat storage
  async saveMessage(messageId, userMessage, aiResponse, conversationId, searchEnabled = false, imageEnabled = false) {
    try {
      log('🟦 ICP Service: saveMessage called', { messageId, conversationId, hasIdentity: !!this._currentIdentity });
      
      // Use the current identity for authentication
      const actorInstance = await createActor(this._currentIdentity);
      const result = await actorInstance.saveMessage(
        messageId,
        userMessage,
        aiResponse,
        conversationId,
        searchEnabled,
        imageEnabled
      );
      
      log('🟦 ICP Service: saveMessage canister response', result);
      
      if ('ok' in result) {
        return { success: true, message: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('🟦 ICP Service: Save message failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserMessages() {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.getUserMessages();
      
      if ('ok' in result) {
        return { success: true, messages: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('Get user messages failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getConversationMessages(conversationId) {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.getConversationMessages(conversationId);
      
      if ('ok' in result) {
        return { success: true, messages: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('Get conversation messages failed:', error);
      return { success: false, error: error.message };
    }
  },

  async searchMessages(searchTerm) {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.searchMessages(searchTerm);
      
      if ('ok' in result) {
        return { success: true, messages: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      error('Search messages failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Stats
  async getMessageCount() {
    try {
      const actorInstance = await createActor();
      const count = await actorInstance.getMessageCount();
      return { success: true, count: Number(count) };
    } catch (error) {
      error('Get message count failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserCount() {
    try {
      const actorInstance = await createActor();
      const count = await actorInstance.getUserCount();
      return { success: true, count: Number(count) };
    } catch (error) {
      error('Get user count failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Account Upgrade Functions
  async canUpgradeAccount(userId) {
    try {
      const actorInstance = await createActor();
      const principal = Principal.fromText(userId);
      const canUpgrade = await actorInstance.canUpgradeAccount(principal);
      
      return {
        success: true,
        canUpgrade
      };
    } catch (error) {
      error('Can upgrade account failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async upgradeGuestToPermanent(guestUserId, newPrincipal, authMethod = 'internet_identity') {
    try {
      const actorInstance = await createActor();
      const request = {
        guestUserId: Principal.fromText(guestUserId),
        newPrincipal: Principal.fromText(newPrincipal),
        authMethod
      };
      
      const result = await actorInstance.upgradeGuestToPermanent(request);
      
      return {
        success: result.success,
        message: result.message,
        upgradedUser: result.upgradedUser.length > 0 ? result.upgradedUser[0] : null,
        migratedMessages: Number(result.migratedMessages)
      };
    } catch (error) {
      error('Upgrade guest to permanent failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async linkAccountToInternetIdentity(guestUserId) {
    try {
      const actorInstance = await createActor();
      const guestPrincipal = Principal.fromText(guestUserId);
      const result = await actorInstance.linkAccountToInternetIdentity(guestPrincipal);
      
      return {
        success: result.success,
        message: result.message,
        upgradedUser: result.upgradedUser.length > 0 ? result.upgradedUser[0] : null,
        migratedMessages: Number(result.migratedMessages)
      };
    } catch (error) {
      error('Link account to Internet Identity failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default icpService; 