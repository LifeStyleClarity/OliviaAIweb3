import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Canister ID from your deployment
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';

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

const createAgent = async () => {
  if (!agent) {
    try {
      agent = new HttpAgent({ host: HOST });
      
      // In development, fetch the root key
      if (import.meta.env.DEV) {
        await agent.fetchRootKey();
      }
      
      console.log('🟦 ICP Agent created successfully');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('🟦 ICP agent connection failed (development mode):', error.message);
      } else {
        console.error('🟦 Failed to create ICP agent:', error);
      }
      throw error;
    }
  }
  return agent;
};

const createActor = async () => {
  if (!actor) {
    const agentInstance = await createAgent();
    actor = Actor.createActor(idlFactory, {
      agent: agentInstance,
      canisterId: CANISTER_ID,
    });
  }
  return actor;
};

export const icpService = {
  // Test connection
  async testConnection() {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.greet('Frontend');
      return { success: true, message: result };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('🟦 ICP connection test failed (development mode):', error.message);
      } else {
        console.error('ICP connection test failed:', error);
      }
      return { success: false, error: error.message };
    }
  },

  // User management
  async createUser(firstName, lastName, email, telegramId = null, walletAddress = null) {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.createUser(firstName, lastName, email, telegramId ? [telegramId] : [], walletAddress ? [walletAddress] : []);
      
      if ('ok' in result) {
        return { success: true, user: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Create user failed:', error);
      return { success: false, error: error.message };
    }
  },

  async createGuestUser() {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.createGuestUser();
      
      if ('ok' in result) {
        return { success: true, user: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Create guest user failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getUser() {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.getUser();
      
      if ('ok' in result) {
        return { success: true, user: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Get user failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Chat storage
  async saveMessage(messageId, userMessage, aiResponse, conversationId, searchEnabled = false, imageEnabled = false) {
    try {
      const actorInstance = await createActor();
      const result = await actorInstance.saveMessage(
        messageId,
        userMessage,
        aiResponse,
        conversationId,
        searchEnabled,
        imageEnabled
      );
      
      if ('ok' in result) {
        return { success: true, message: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Save message failed:', error);
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
      console.error('Get user messages failed:', error);
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
      console.error('Get conversation messages failed:', error);
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
      console.error('Search messages failed:', error);
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
      console.error('Get message count failed:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserCount() {
    try {
      const actorInstance = await createActor();
      const count = await actorInstance.getUserCount();
      return { success: true, count: Number(count) };
    } catch (error) {
      console.error('Get user count failed:', error);
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
      console.error('Can upgrade account failed:', error);
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
      console.error('Upgrade guest to permanent failed:', error);
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
      console.error('Link account to Internet Identity failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default icpService; 