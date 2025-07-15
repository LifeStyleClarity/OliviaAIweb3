# API Documentation

- [Overview](#overview)
- [Authentication](#authentication)
- [Directory Structure](#directory-structure)
- [Environment Configuration](#environment-configuration)
- [Services](#services)
  - [Chat Service](#chat-service)
  - [Authentication & User Management](#authentication--user-management)
  - [Notification System](#notification-system)
  - [Trade Service](#trade-service)
  - [Profile Service](#profile-service)
  - [Portfolio Service](#portfolio-service-ton-microservice)
  - [Social Service](#social-service-main-api-with-auth)
- [Best Practices](#best-practices)
- [Security Considerations](#security-considerations)
- [Maintenance](#maintenance)

## Overview

The API layer is organized into a modular structure to handle different features of the application, including multiple microservices and secure authentication. This documentation explains how to use and extend the API configuration.

## Authentication

The main API requires a secret key for authentication:
```javascript
// Secret key is automatically generated daily using CryptoJS
const getSecretKey = () => {
    const todayDate = new Date().toISOString().split("T")[0];
    return CryptoJS.SHA256(`${SECRET_KEY}${todayDate}`).toString(CryptoJS.enc.Hex);
};
```

This secret key is automatically included in all main API requests through an [axios interceptor](src/api/config/axios.js) as the 'cs' header. Additionally, a 'called_made_at' timestamp is included with each request for audit purposes. The TON portfolio microservice uses its own authentication mechanism.

## Directory Structure

```
src/api/
├── config/
│   ├── endpoints.js     # API endpoints configuration
│   └── axios.js        # Axios instance with secret key interceptor
├── services/
│   ├── auth.service.js      # User authentication and management
│   ├── portfolio.service.js  # TON Portfolio microservice
│   ├── social.service.js     # Social data with auth
│   ├── chat.service.js       # WebSocket chat functionality
│   ├── notification.service.js # User notifications
│   ├── trade.service.js      # Trade operations
│   └── profile.service.js    # User profile settings
├── types/
│   ├── auth.types.js        # Authentication type definitions
│   ├── portfolio.types.js   # Portfolio type definitions
│   ├── social.types.js      # Social data type definitions
│   ├── notification.types.js # Notification type definitions
│   └── trade.types.js       # Trade type definitions
└── index.js            # Central export point
```

**Key Files:**
- [src/api/index.js](src/api/index.js) - Main entry point for API exports
- [src/api/config/endpoints.js](src/api/config/endpoints.js) - API endpoint configuration
- [src/api/config/axios.js](src/api/config/axios.js) - Main API axios instance
- [src/api/config/axios-profile.js](src/api/config/axios-profile.js) - Profile API axios instance

## Environment Configuration

The API URLs and secrets are configured in environment variables:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_TON_API=https://ton-api.example.com
VITE_SECRET=your-secret-key
VITE_WEBSOCKET_URL=wss://websocket.example.com
VITE_TOKEN_TRACKER_API_URL=https://token-tracker-api.example.com
```

## Services

### Chat Service

The [chat service](src/api/services/chat.service.js) handles real-time communication through WebSocket connections, supporting both text and audio chat with AI agents.

#### WebSocket Configuration

```javascript
export const ENDPOINTS = {
    WEBSOCKET: {
        CHAT: `${WS_BASE_URL}/api/v1/ws/chat`,        // Regular chat
        AGENT_CHAT: `${WS_BASE_URL}/api/v1/ws/chat/agents`, // Agent-specific chat
        AUDIO: `${WS_BASE_URL}/api/v1/ws/audio`       // Audio communication
    }
};
```

#### Message Types

```typescript
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    type: 'olivia_chat';
    created_at: string;
    message_id: string;
}

interface MessageData {
    user_id: string;
    user_input: string;
    trade_style: string;
    messages: ChatMessage[];
    agent_name?: string;  // Optional for agent chats
    agent_id?: string;    // Optional for agent chats
}

interface AudioMessageData {
    metadata: {
        user_id: string;
        trade_style: string;
        file_type: string;
    };
    audio: string;       // Base64 encoded audio
    messages: ChatMessage[];
}

interface BotResponse {
    action_type: 'conversation_going' | 'action';
    final_answer: {
        message: string;
        action?: string;
        data?: any;
        meta?: any;
        amount?: number;
        swap_type?: string;
        contract_address?: string;
    };
    audio?: string;      // Base64 encoded audio response
}
```

#### Using Chat Service

```javascript
import { chatService } from '@/api';

// Get WebSocket URLs
const chatUrl = chatService.getChatWebSocketUrl();
const agentChatUrl = chatService.getChatWebSocketUrl(true); // For agent chat
const audioUrl = chatService.getAudioWebSocketUrl();

// Format messages
const messages = chatService.formatMessages([
    { text: "Hello", sender: "user" }
]);

// Create text message data
const messageData = chatService.createMessageData(
    "Buy BTC",
    previousMessages,
    { name: "Trading Agent", id: "agent-1" }
);

// Create audio message data
const audioData = await chatService.createAudioMessageData(
    audioBlob,
    "Manual"
);

// Parse bot responses
const textResponse = chatService.parseBotMessageContent(response);
// {
//     text: string,
//     action_type: string,
//     sub_action_type?: string,
//     meta?: any,
//     amount?: number,
//     swap_type?: string,
//     contract_address?: string
// }

// Parse audio responses
const audioResponse = await chatService.parseAudioResponse(response);
// {
//     type: "audio",
//     data: Blob,
//     text: string,
//     meta: any,
//     action_type: string,
//     sub_action_type: string
// }
```

#### Action Types

The chat service supports various action types in bot responses:

1. **conversation_going**: Regular chat conversation
   ```javascript
   {
       action_type: "conversation_going",
       final_answer: "I understand you want to trade BTC..."
   }
   ```

2. **action**: Special actions like portfolio display or swaps
   ```javascript
   {
       action_type: "action",
       final_answer: {
           action: "show_portfolio",
           message: "Here's your portfolio",
           data: { /* portfolio data */ }
       }
   }
   ```

3. **swap**: Token swap actions
   ```javascript
   {
       action_type: "action",
       final_answer: {
           action: "swap",
           message: "Processing swap...",
           amount: 100,
           swap_type: "buy",
           contract_address: "0x..."
       }
   }
   ```

#### Audio Handling

The service handles audio conversion between Blob and Base64 formats:

```javascript
// Send audio
const audioBlob = new Blob([audioData], { type: "audio/wav" });
const messageData = await chatService.createAudioMessageData(audioBlob);

// Receive audio
const response = await chatService.parseAudioResponse(botResponse);
const audioBlob = response.data; // Ready for playback
```

### Authentication & User Management

The [auth service](src/api/services/auth.service.js) handles user authentication, account management, and wallet connections.

#### Auth Types

```typescript
enum AuthModalType {
  /** When a user tries to connect a wallet that differs from their existing one */
  WALLET_MISMATCH = 'WALLET_MISMATCH',
  
  /** When a Telegram user wants to add a wallet to their account */
  ADD_WALLET = 'ADD_WALLET',
  
  /** When multiple accounts are found for the same Telegram ID */
  MULTIPLE_ACCOUNTS = 'MULTIPLE_ACCOUNTS',
  
  /** When a new wallet is being added and needs to be aggregated */
  AGGREGATE_NEW = 'AGGREGATE_NEW'
}
```

#### User Management Endpoints

```javascript
export const ENDPOINTS = {
    USER: {
        CREATE_USER: `${API_BASE_URL}/users`,
        CHECK_USER: `${API_BASE_URL}/users/check`,
        UPDATE_USER: `${API_BASE_URL}/users/:id`,
        GET_USER_BY_TELEGRAM: `${API_BASE_URL}/users/telegram/:id`,
        AGGREGATE_WALLETS: `${API_BASE_URL}/users/aggregate`,
        CHECK_GALAXY_INSTANCE: `${API_BASE_URL}/users/:id/galaxy`,
        CREATE_GALAXY_INSTANCE: `${API_BASE_URL}/users/galaxy`,
        UPDATE_GALAXY_INSTANCE: `${API_BASE_URL}/users/:id/galaxy`,
        CHECK_PROFILE_SETTINGS: `${API_BASE_URL}/users/:id/profile`,
        CREATE_PROFILE_SETTINGS: `${API_BASE_URL}/users/profile`
    }
};
```

#### User Profile Settings

Default profile settings structure:
```javascript
{
  user_id: string,
  trade_style: "Manual",
  wallets: [],
  risk_profile: "Low",
  stop_loss: 0.2,
  take_profit: 0.2,
  trailing_stop: 0.2,
  slippage: 0.1,
  current_step: 1
}
```

### Notification System

The [notification service](src/api/services/notification.service.js) manages user notifications for various events in the application.

#### Notification Types

```typescript
interface Notification {
  notification_id: string;
  user_id: string;
  message_subject: string;
  message_content: string;
  message_type: string;
  status: 'Read' | 'Unread';
  created_at: string;
  updated_at: string;
}

interface NotificationUpdateData {
  status?: 'Read' | 'Unread';
}
```

#### Notification Endpoints

```javascript
export const ENDPOINTS = {
    NOTIFICATIONS: {
        GET_USER_NOTIFICATIONS: `${TOKEN_TRACKER_API_URL}/notifications/user/:id`,
        MARK_ALL_READ: `${TOKEN_TRACKER_API_URL}/notifications/user/:id/mark-read`,
        UPDATE_NOTIFICATION: `${TOKEN_TRACKER_API_URL}/notifications/:id`,
        DELETE_NOTIFICATION: `${TOKEN_TRACKER_API_URL}/notifications/:id`
    }
};
```

#### Using Notification Service

```javascript
import { notificationService } from '@/api';

// Get user notifications
const notifications = await notificationService.getNotificationsByUserId(userId);

// Mark all as read
await notificationService.setNotificationsToRead(userId);

// Update single notification
await notificationService.updateNotification(notificationId, { status: 'Read' });

// Delete notification
await notificationService.deleteNotification(notificationId);
```

### Trade Service

The [trade service](src/api/services/trade.service.js) handles operations related to cryptocurrency trades, including creating, updating, fetching, and deleting trade records.

#### Trade Types

```typescript
interface Trade {
  trade_id: string;        // Unique identifier for the trade
  user_id: string;         // ID of the user who made the trade
  token_address: string;   // Contract address of the traded token
  token_symbol: string;    // Symbol of the traded token
  amount: number;          // Amount of tokens traded
  price: number;           // Price at which the trade was executed
  type: 'BUY' | 'SELL';    // Type of trade
  status: 'PENDING' | 'COMPLETED' | 'FAILED'; // Status of the trade
  created_at: string;      // Timestamp when the trade was created
  updated_at: string;      // Timestamp when the trade was last updated
}

interface CreateTradePayload {
  user_id: string;         // ID of the user making the trade
  token_address: string;   // Contract address of the token to trade
  token_symbol: string;    // Symbol of the token to trade
  amount: number;          // Amount of tokens to trade
  price: number;           // Price at which to execute the trade
  type: 'BUY' | 'SELL';    // Type of trade
}

interface UpdateTradePayload {
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'; // New status of the trade
  amount?: number;         // Updated amount of tokens
  price?: number;          // Updated trade price
}
```

#### Trade Endpoints

```javascript
export const ENDPOINTS = {
    TRADING: {
        CREATE_TRADE: `${TOKEN_TRACKER_API_URL}/trades`,
        UPDATE_TRADE: `${TOKEN_TRACKER_API_URL}/trades/:id`,
        GET_USER_TRADES: `${TOKEN_TRACKER_API_URL}/trades/user/:id`,
        GET_TRADE: `${TOKEN_TRACKER_API_URL}/trades/:id`,
        DELETE_TRADE: `${TOKEN_TRACKER_API_URL}/trades/:id`
    }
};
```

#### Using Trade Service

```javascript
import { tradeService } from '@/api';

// Create a new trade
const newTrade = await tradeService.createTrade({
  user_id: 'user-123',
  token_address: '0x123abc...',
  token_symbol: 'BTC',
  amount: 0.5,
  price: 50000,
  type: 'BUY'
});

// Update an existing trade
await tradeService.updateTrade('trade-123', {
  status: 'COMPLETED',
  price: 51000
});

// Get all trades for a user
const userTrades = await tradeService.getUserTrades('user-123');

// Get a specific trade
const trade = await tradeService.getTrade('trade-123');

// Delete a trade
await tradeService.deleteTrade('trade-123');
```

#### Error Handling

```javascript
try {
  const trades = await tradeService.getUserTrades(userId);
} catch (error) {
  if (error.response?.status === 404) {
    // No trades found for this user
    console.log('No trades found');
  } else {
    // Handle other errors
    console.error('Failed to fetch trades:', error);
  }
}
```

### Profile Service

The [profile service](src/api/services/profile.service.js) manages user profile settings, including trade preferences and risk profiles.

#### Profile Settings Types

```typescript
interface ProfileSettings {
  user_id: string;         // ID of the user
  trade_style: string;     // Trading style (e.g., "Manual", "Automatic")
  wallets: string[];       // Array of wallet addresses
  risk_profile: string;    // Risk profile (e.g., "Low", "Medium", "High")
  stop_loss: number;       // Stop loss percentage (e.g., 0.2 for 20%)
  take_profit: number;     // Take profit percentage
  trailing_stop: number;   // Trailing stop percentage
  slippage: number;        // Slippage tolerance percentage
  current_step: number;    // Current onboarding step
}
```

#### Profile Settings Endpoints

```javascript
export const ENDPOINTS = {
    PROFILE_SETTINGS: {
        GET_USER_SETTINGS: `${TOKEN_TRACKER_API_URL}/profile_settings/user/:id`,
        CREATE_SETTINGS: `${TOKEN_TRACKER_API_URL}/profile_settings`,
        UPDATE_SETTINGS: `${TOKEN_TRACKER_API_URL}/profile_settings/user/:id`
    }
};
```

#### Using Profile Service

```javascript
import { profileService } from '@/api';

// Check if profile settings exist for a user
const settings = await profileService.checkProfileSettingsExists('user-123');

// Create new profile settings
const newSettings = await profileService.createProfileSettings({
  user_id: 'user-123',
  trade_style: 'Manual',
  wallets: ['0xabc123...'],
  risk_profile: 'Medium',
  stop_loss: 0.15,
  take_profit: 0.3,
  trailing_stop: 0.1,
  slippage: 0.05,
  current_step: 1
});

// Update profile settings
await profileService.updateProfileSettings('user-123', {
  risk_profile: 'High',
  stop_loss: 0.1
});

// Create default settings for a new user
await profileService.createDefaultSettings('user-123');
```

#### Default Profile Settings

The service provides a method to create default profile settings for new users:

```javascript
// Default settings structure
{
  user_id: 'user-123',
  trade_style: "Manual",
  wallets: [],
  risk_profile: "Low",
  stop_loss: 0.2,
  take_profit: 0.2,
  trailing_stop: 0.2,
  slippage: 0.1,
  current_step: 1
}
```

#### Error Handling

```javascript
try {
  const settings = await profileService.checkProfileSettingsExists(userId);
  if (!settings) {
    // Create default settings if none exist
    await profileService.createDefaultSettings(userId);
  }
} catch (error) {
  console.error('Failed to manage profile settings:', error);
}
```

### Galaxy Blaster Integration

The auth service includes integration with the Galaxy Blaster game. See [auth.service.js](src/api/services/auth.service.js) for implementation details.

Default Galaxy Blaster instance structure:
```javascript
{
  user_id: string,
  crypto_wallet_address: string,
  last_score: 0,
  high_score: 0,
  total_score: 0,
  season_two_total_score: 0,
  games_played: 0,
  tokens_collected: [
    {
      amount: 0,
      coin_id: string,
      coin_name: string,
      image_url: string
    }
  ],
  season_two_tokens_collected: [/* similar structure */],
  points_by_click: 0,
  referral_points_earned: 0,
  aliens_threshold: 50,
  total_aliens_killed: 0
}
```

### Portfolio Service (TON Microservice)

The [portfolio service](src/api/services/portfolio.service.js) interacts with a separate TON microservice and does not require the secret key interceptor.

#### Portfolio Types

```typescript
interface PortfolioToken {
  coinId: string;          // Unique identifier for the token
  amount: number;          // Token balance
  contractAddress: string; // Token contract address
  chain: string;          // Blockchain network
  name: string;           // Token name
  symbol: string;         // Token symbol
  price: number;          // Current price in USD
  priceBtc: number;       // Current price in BTC
  imgUrl: string;         // Token icon URL
  pCh24h: number;         // 24h price change percentage
  rank: number;           // Market cap rank
  volume: number;         // 24h trading volume
  decimals?: number;      // Token decimals (optional)
  
  // Additional calculated fields:
  totalValue: number;     // amount * price
  formattedAmount: number; // amount adjusted for decimals
}

interface PortfolioResponse {
  portfolio: PortfolioToken[];
}
```

#### Using Portfolio Service

```javascript
import { portfolioService } from '@/api';

// Fetch and format portfolio data
const portfolio = await portfolioService.getPortfolio(walletAddress);

// The service automatically:
// 1. Makes POST request to TON API
// 2. Validates response format
// 3. Calculates additional fields:
//    - totalValue = amount * price
//    - formattedAmount = amount / (10 ** decimals)
// 4. Returns formatted PortfolioToken array
```

#### Error Handling

```javascript
try {
  const portfolio = await portfolioService.getPortfolio(address);
} catch (error) {
  if (error.message.includes('Invalid portfolio data format')) {
    // Handle malformed response
  } else {
    // Handle other errors
    console.error('Portfolio fetch failed:', error);
  }
}
```

### Social Service (Main API with Auth)

The [social service](src/api/services/social.service.js) handles influencer and token data, including tracking token mentions and aggregating social metrics.

#### Social Types

```typescript
interface Cashtag {
  cashtag: string;  // Token symbol (e.g., "BTC", "ETH", "TON")
  mentions: number; // Number of mentions for this cashtag
}

interface Influencer {
  id: string;
  name: string;
  username?: string;      // Social media username
  cashtags: Cashtag[];   // Array of cashtags with mention counts
}

interface Token {
  token_symbol: string;      // Token symbol matching cashtag
  token_icon: string;        // Token icon URL
  force_show: boolean;       // Whether to prioritize this token in display
  name?: string;             // Token name
  contract_address?: string; // Token contract address
  price?: number;            // Current token price
  market_cap?: number;       // Token market capitalization
  volume?: number;           // Trading volume
}

interface TopCashtagWithToken {
  cashtag: string;          // Token symbol/cashtag
  totalMentions: number;    // Aggregated mentions across all influencers
  data: Token;              // Complete token data
}
```

#### Using Social Service

```javascript
import { socialService } from '@/api';

// Get all influencers with their cashtag mentions
const influencers = await socialService.getInfluencers();

// Get all available tokens
const tokens = await socialService.getTokens();

// Get top mentioned tokens with aggregated data
const topTokens = await socialService.getTopMentionedTokens(3);

// The getTopMentionedTokens method:
// 1. Fetches both influencers and tokens data in parallel
// 2. Accumulates total mentions per cashtag across all influencers
// 3. Sorts by descending number of mentions
// 4. Takes the top N cashtags (default 3)
// 5. For each top cashtag:
//    - Finds matching tokens by symbol
//    - Prioritizes tokens with force_show=true
//    - Includes only tokens with icons
// 6. Returns TopCashtagWithToken array
```

#### Error Handling

```javascript
try {
  const topTokens = await socialService.getTopMentionedTokens(5);
} catch (error) {
  console.error('Failed to fetch social data:', error);
  // Handle error appropriately
}
```

## Best Practices

1. **Authentication & Security**
   - Use [axiosInstance](src/api/config/axios.js) for main API calls to include secret key
   - Direct axios for microservice calls
   - Never expose SECRET_KEY in client-side code
   - Use environment variables for all sensitive configuration

2. **Error Handling**
   - Always wrap API calls in try/catch blocks
   - Use logError for consistent error logging
   - Consider implementing retry logic for failed requests

3. **Type Safety**
   - Use JSDoc comments for type definitions
   - Document all parameters and return types
   - Consider using TypeScript for better type safety

4. **Service Structure**
   - Keep services focused on a single feature
   - Use class methods for related operations
   - Implement data formatting in the service layer

## Security Considerations

1. Always use HTTPS for API calls
2. Never expose SECRET_KEY in client-side code
3. Implement proper authentication/authorization
4. Validate all API responses
5. Use environment variables for sensitive configuration
6. Daily rotating secret keys for enhanced security
7. Request timestamps for audit trails

## Maintenance

1. Keep [endpoints.js](src/api/config/endpoints.js) updated with all available endpoints
2. Document any changes to API response structures
3. Update type definitions when API contracts change
4. Monitor API performance and error rates

## Related Documentation

- [Axios Documentation](https://axios-http.com/docs/intro)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)
- [JSDoc Reference](https://jsdoc.app/)
