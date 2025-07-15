# Beta Wallet V2 Documentation

## Project Overview
Beta Wallet V2 is a React-based web application that integrates blockchain functionality with an AI assistant named Olivia. The application provides features for portfolio management, trading, social sentiment analysis, and AI-assisted interactions through both text and voice interfaces.

## Tech Stack
- **Frontend Framework**: React 18.2.0 with Vite
- **Styling**: TailwindCSS
- **UI Components**: @heroui/react
- **Routing**: react-router-dom
- **Blockchain Integration**: @tonconnect/ui-react
- **Audio Processing**: wavesurfer.js
- **Animations**: framer-motion
- **Notifications**: sonner
- **Crypto**: crypto-js (for API authentication)

## Project Structure
```
src/
├── api/                  # API integration layer
│   ├── config/          # API configuration and setup
│   │   ├── endpoints.js     # API endpoints configuration
│   │   ├── axios.js         # Main API axios instance
│   │   └── axios-profile.js # Profile API axios instance
│   ├── services/        # Service implementations
│   │   ├── auth.service.js      # User authentication and management
│   │   ├── portfolio.service.js # TON Portfolio microservice
│   │   ├── social.service.js    # Social data with auth
│   │   ├── chat.service.js      # WebSocket chat functionality
│   │   ├── notification.service.js # User notifications
│   │   ├── trade.service.js     # Trade operations
│   │   └── profile.service.js   # User profile settings
│   ├── types/           # TypeScript-like type definitions
│   │   ├── auth.types.js        # Authentication type definitions
│   │   ├── portfolio.types.js   # Portfolio type definitions
│   │   ├── social.types.js      # Social data type definitions
│   │   ├── notification.types.js # Notification type definitions
│   │   └── trade.types.js       # Trade type definitions
│   └── index.js         # Central export point
├── components/
│   ├── AgentDataViews/  # Components for displaying agent-related data
│   ├── features/        # Feature-specific components
│   │   ├── home/       # Home page features
│   │   ├── explore/    # Explore page features
│   │   └── portfolio/  # Portfolio page features
│   ├── layout/         # Layout components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── utils/             # Utility functions
└── docs/              # Component and API documentation
    ├── API.md         # API documentation
    └── HEROUI/        # HeroUI component documentation
```

## Core Features

### 1. Authentication
- Protected route system implemented in `App.jsx`
- Authentication state management with React context
- Login page with redirect functionality
- Daily rotating API secret keys for enhanced security

### 2. API Integration
The application uses a modular API structure with multiple services:

#### Portfolio Service (TON Microservice)
- Handles portfolio data retrieval and management
- Direct integration with TON blockchain
- Custom authentication mechanism
- Formats and calculates additional portfolio metrics

#### Social Service
- Manages social data and influencer information
- Includes cashtag tracking and token mentions
- Secured with daily rotating secret keys
- Aggregates social sentiment data

#### Chat Service
- Handles WebSocket communication for text and audio chat
- Supports different message types and action responses
- Manages audio conversion between Blob and Base64 formats
- Provides message formatting and parsing utilities

#### Trade Service
- Manages cryptocurrency trade operations
- Supports creating, updating, and deleting trades
- Tracks trade status and history
- Handles error cases with appropriate fallbacks

#### Profile Service
- Manages user profile settings and preferences
- Handles trade style and risk profile configuration
- Supports wallet management and aggregation
- Provides default settings for new users

#### Notification Service
- Manages user notifications
- Supports marking notifications as read
- Handles notification deletion and updates
- Filters notifications by user ID

For detailed API documentation with examples and type definitions, see [API Documentation](src/docs/API.md).

### 3. AI Assistant (Olivia)
The application features an AI assistant named Olivia that provides interactive support through both text and voice interfaces.

#### Text Chat Implementation
- WebSocket-based real-time communication
- Message handling with retry mechanism
- Support for different types of responses (conversation, actions)
- Implemented in `useChatWebSocket.js`

Key Features:
```javascript
const { sendMessage, disconnect, isBotResponding } = useChatWebSocket(onMessageReceived);
```

#### Voice Chat Implementation
- Audio WebSocket connection for voice interactions
- Base64 audio processing
- Automatic reconnection handling
- Implemented in `useAudioWebSocket.js`

Key Features:
```javascript
const { sendAudio, disconnect } = useAudioWebSocket(onMessageReceived);
```

### 4. Trading Features
- Portfolio value tracking
- Trading token analysis
- Influencer sentiment tracking
- Market trend analysis

### 5. Chat Interface
The chat interface is implemented through several components:

#### ChatModal
- Main container for chat functionality
- Handles message state and WebSocket connections
- Manages audio and text message processing
- Located in `src/components/ui/ChatModal.jsx`

#### ChatInput
- Handles text input and audio recording
- Supports agent-specific messages
- Disabled state during bot responses

#### ChatMessages
- Displays conversation history
- Supports different message types (text, audio)
- Message update functionality

## WebSocket Communication

### Chat WebSocket
- Endpoint: `${VITE_WEBSOCKET_URL}/api/v1/ws/chat`
- Handles text-based communication
- Supports retry mechanism with exponential backoff
- Maximum retry attempts: 3

Message Format:
```javascript
{
  user_id: string,
  user_input: string,
  trade_style: string,
  messages: Array<{
    role: "user" | "assistant",
    content: string,
    type: string,
    created_at: string,
    message_id: string
  }>
}
```

### Audio WebSocket
- Endpoint: `${VITE_WEBSOCKET_URL}/api/v1/ws/audio`
- Handles voice-based communication
- Supports audio blob processing
- Automatic reconnection with exponential backoff

Audio Message Format:
```javascript
{
  metadata: {
    user_id: string,
    trade_style: string,
    file_type: string
  },
  audio: string, // base64 encoded audio
  messages: Array<Message>
}
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required environment variables:
```
VITE_WEBSOCKET_URL=your_websocket_url        # WebSocket server URL
VITE_API_BASE_URL=your_api_url               # Main API base URL
VITE_TON_API=your_ton_api_url                # TON blockchain API URL
VITE_SECRET=your_secret_key                  # Secret key for API authentication
VITE_TOKEN_TRACKER_API_URL=your_tracker_url  # Token tracker API URL
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

For more details on API configuration, see the [API Documentation](src/docs/API.md#environment-configuration).

## Best Practices

1. **API Integration**
   - Use appropriate service for each feature
   - Implement proper error handling
   - Follow type definitions for data structures
   - Use [axiosInstance](src/api/config/axios.js) for authenticated requests

2. **WebSocket Error Handling**
   - Implement retry mechanisms with exponential backoff
   - Provide user feedback through toast notifications
   - Clean up connections on component unmount

3. **State Management**
   - Use React context for global state (see [AuthContext](src/contexts/AuthContext.jsx) and [ChatContext](src/contexts/ChatContext.jsx))
   - Implement proper cleanup in useEffect hooks
   - Maintain message history state

4. **Audio Processing**
   - Convert audio blobs to base64 for transmission
   - Handle audio playback with proper error checking (see [AudioPlayback](src/components/ui/microphone/AudioPlayback.jsx))
   - Implement proper cleanup of audio resources

5. **UI/UX Considerations**
   - Show loading states during processing
   - Provide visual feedback for user actions
   - Implement proper error handling and user notifications

For more detailed implementation guidelines, refer to the [API Documentation](src/docs/API.md#best-practices).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Add your license information here]
