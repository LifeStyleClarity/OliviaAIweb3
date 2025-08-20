# Frontend Environment Variables

Add these to your frontend `.env` file to enable the secure OpenAI microservice integration:

```env
# Existing WebSocket URL (fallback)
VITE_WEBSOCKET_URL=ws://localhost:8000

# OpenAI Microservice Configuration (NEW)
VITE_OPENAI_MICROSERVICE_URL=http://localhost:3001
VITE_OPENAI_MICROSERVICE_TOKEN=your_secure_admin_token_here

# API Gateway URLs (existing)
VITE_API_GATEWAY_URL=https://api.example.com
VITE_API_GATEWAY_TON_URL=https://ton-api.example.com
VITE_API_GATEWAY_JWT=your_jwt_token
```

## Configuration Notes:

1. **VITE_OPENAI_MICROSERVICE_URL**: The base URL of your OpenAI microservice
2. **VITE_OPENAI_MICROSERVICE_TOKEN**: The admin access token for authenticating with the microservice
3. The WebSocket will automatically use the secure proxy at `ws://localhost:3001/ws/secure-proxy`
4. If the microservice is not available, it will fallback to the external WebSocket endpoints

## Security Benefits:

- ✅ **Token Authentication**: All WebSocket connections are authenticated
- ✅ **Origin Validation**: Only your frontend can connect to the WebSocket
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Secure Proxy**: External WebSocket endpoints are not directly exposed
- ✅ **Monitoring**: Connection statistics and health checks available
