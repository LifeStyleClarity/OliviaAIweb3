# OpenAI Microservice

A secure Node.js microservice for OpenAI API integration with authentication, rate limiting, and CORS protection.

## Features

- 🔐 **Authentication**: Secured with admin access token
- 🚦 **Rate Limiting**: Configurable rate limits for API protection
- 🌐 **CORS Protection**: Only allows requests from specified origins
- 🛡️ **Security**: Helmet.js security headers and input validation
- 📊 **Monitoring**: Request logging and health check endpoint
- ⚡ **Performance**: Express.js with ES6 modules
- 🔌 **Secure WebSocket Proxy**: Protected WebSocket proxy to external AI services

## Prerequisites

- Node.js 16+ 
- npm or yarn
- OpenAI API key

## Installation

1. Clone and navigate to the project:
```bash
cd openai-microservice
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```bash
# Copy the example and modify as needed
cp .env.example .env
```

Required environment variables:
- `ADMIN_ACCESS_SECRET`: Your admin access token
- `OPENAI_API_KEY`: Your OpenAI API key
- `ALLOWED_ORIGIN`: The only URL allowed to call this service

## Configuration

Edit the `.env` file with your specific values:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Authentication
ADMIN_ACCESS_SECRET=your_secret_token_here

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Security Configuration
ALLOWED_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Proxy Configuration
WEBSOCKET_PATH=/ws/secure-proxy
EXTERNAL_WEBSOCKET_URLS=wss://your-ai-service.com/ws/agent/stream,wss://your-ai-service.com/ws
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```
No authentication required.

### WebSocket Secure Proxy
```
WS /ws/secure-proxy
```

A secure WebSocket proxy that acts as an intermediary between frontend clients and external AI WebSocket services.

**Features:**
- 🔐 **Authentication**: Token-based authentication via query parameter or header
- 🌐 **Origin Validation**: Only allows connections from configured origins  
- 🔄 **Auto-Failover**: Automatically tries multiple external endpoints
- 📊 **Connection Tracking**: Monitors active connections and statistics
- 🛡️ **Security Layer**: Protects external service endpoints from direct exposure

**Connection Example:**
```javascript
// With token as query parameter (recommended)
const ws = new WebSocket('ws://localhost:3001/ws/secure-proxy?token=your_admin_token');

// With token in Authorization header (alternative)
const ws = new WebSocket('ws://localhost:3001/ws/secure-proxy', [], {
  headers: { 'Authorization': 'Bearer your_admin_token' }
});
```

### WebSocket Statistics
```
GET /api/websocket/stats
```

Get current WebSocket proxy statistics including active connections and endpoint status.

### Chat Completions
```
POST /api/openai/chat/completions
```

Headers:
```
Authorization: Bearer your_admin_access_secret
Content-Type: application/json
Origin: your_allowed_origin
```

Body:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Hello, how are you?"
    }
  ],
  "model": "gpt-3.5-turbo",
  "max_tokens": 1000,
  "temperature": 0.7
}
```

### Extract Trading Parameters
```
POST /api/openai/extract-trading
```

Extract trading parameters from natural language input using OpenAI function calling.

Headers:
```
Authorization: Bearer your_admin_access_secret
Content-Type: application/json
Origin: your_allowed_origin
```

Body:
```json
{
  "input": "I would like to buy TON by swapping 100 USD to TON"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "original_input": "I would like to buy TON by swapping 100 USD to TON",
    "extracted_parameters": {
      "from_currency": "USD",
      "to_currency": "TON", 
      "amount": 100,
      "operation_type": "buy"
    },
    "function_call_id": "call_abc123",
    "openai_response": {
      "id": "chatcmpl-xyz789",
      "model": "gpt-4",
      "usage": {
        "prompt_tokens": 85,
        "completion_tokens": 15,
        "total_tokens": 100
      }
    }
  }
}
```

### Get Models
```
GET /api/openai/models
```

Headers:
```
Authorization: Bearer your_admin_access_secret
Origin: your_allowed_origin
```

## Security Features

- **Authentication**: 
  - **Development**: No authentication required for easy testing
  - **Production**: All OpenAI endpoints require the admin access token
- **Origin Validation**: 
  - **Development**: All origins allowed for convenience
  - **Production**: Only requests from the configured origin are allowed
- **Rate Limiting**: 
  - Global: 100 requests per 15 minutes
  - OpenAI endpoints: 10 requests per minute
- **CORS**: 
  - **Development**: Allows all origins
  - **Production**: Configured to only allow specific origins
- **Security Headers**: Helmet.js provides security headers
- **Input Validation**: Request data is validated before processing

## Error Handling

The service returns structured error responses:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
```

Common error codes:
- `UNAUTHORIZED`: Missing authorization header
- `FORBIDDEN`: Invalid access token
- `FORBIDDEN_ORIGIN`: Origin not allowed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `OPENAI_API_ERROR`: OpenAI API error
- `INVALID_MESSAGES`: Invalid message format

## Testing

### Automated Test Suite

The project includes comprehensive automated tests for the trading parameter extraction functionality:

```bash
# Run all test categories
npm test

# Run individual test examples
node test-examples.js

# Watch mode for development
npm run test:watch
```

The test suite includes:
- ✅ **Valid Crypto Queries**: Proper trading requests that should extract parameters
- ❌ **Non-Crypto Queries**: Non-trading requests that should fail (expected behavior)
- ⚠️ **Ambiguous Queries**: Unclear requests with mixed expected results
- ⚠️ **Incomplete Queries**: Partial trading requests
- 🤔 **Confusing Queries**: Multiple currency mentions requiring analysis

### Manual Testing with cURL

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Test chat completions:
```bash
curl -X POST http://localhost:3001/api/openai/chat/completions \
  -H "Authorization: Bearer your_admin_access_secret" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

Test trading parameter extraction (Development - no auth needed):
```bash
curl -X POST http://localhost:3001/api/openai/extract-trading \
  -H "Content-Type: application/json" \
  -d '{
    "input": "I want to buy 50 TON by swapping USD to TON"
  }'
```

Test trading parameter extraction (Production - auth required):
```bash
curl -X POST http://localhost:3001/api/openai/extract-trading \
  -H "Authorization: Bearer your_admin_access_secret" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "input": "I want to buy 50 TON by swapping USD to TON"
  }'
```

### Test Examples

Some example queries you can test:

**Valid Trading Queries:**
- "I would like to buy TON by swapping USD to TON"
- "Sell 100 ETH for USDT"
- "Swap 0.5 BTC to ETH"
- "Buy Bitcoin with 500 dollars"

**Non-Trading Queries:**
- "What's the weather like today?"
- "How do I bake a chocolate cake?"
- "Tell me a joke about programming"

**Expected Results:**
- Trading queries should return extracted parameters (from_currency, to_currency, amount, operation_type)
- Non-trading queries should fail to extract parameters (expected behavior)
- The system should handle edge cases gracefully

## Architecture

```
src/
├── config/
│   └── config.js          # Environment configuration
├── controllers/
│   └── openaiController.js # OpenAI API logic
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── cors.js            # CORS validation
│   └── rateLimiter.js     # Rate limiting
├── routes/
│   ├── index.js           # Main routes
│   └── openaiRoutes.js    # OpenAI specific routes
└── server.js              # Express server setup
```

## License

ISC
