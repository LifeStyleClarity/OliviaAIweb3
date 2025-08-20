import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config/config.js';
import { corsMiddleware } from './middleware/cors.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { authenticateWebSocket } from './middleware/websocketAuth.js';
import { websocketProxyService } from './services/websocketProxy.js';
import routes from './routes/index.js';

// Create Express application
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Trust proxy for rate limiting (important for getting real client IPs)
app.set('trust proxy', 1);

// CORS middleware
app.use(corsMiddleware);

// Rate limiting middleware (applied globally)
const globalRateLimit = createRateLimiter();
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api', routes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // CORS error
  if (error.message.includes('CORS policy')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Create HTTP server
const PORT = config.port;
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: config.websocketPath
});

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  console.log('🔌 New WebSocket connection attempt');
  
  // Authenticate WebSocket connection
  const authResult = authenticateWebSocket(request);
  
  if (!authResult.success) {
    console.log(`❌ WebSocket authentication failed: ${authResult.message}`);
    ws.close(authResult.code, authResult.message);
    return;
  }
  
  const { clientId } = authResult;
  console.log(`✅ WebSocket connection authenticated: ${clientId}`);
  
  // Create proxy connection to external WebSocket
  try {
    websocketProxyService.createProxyConnection(ws, clientId);
    console.log(`🔗 Proxy connection established for client: ${clientId}`);
  } catch (error) {
    console.error(`🚨 Failed to create proxy connection for client ${clientId}:`, error);
    ws.close(1011, 'Failed to establish proxy connection');
  }
});

// WebSocket server statistics endpoint (after WebSocket server is created)
app.get('/api/websocket/stats', (req, res) => {
  const stats = websocketProxyService.getStats();
  res.json({
    success: true,
    websocket_stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Start server only when run directly (not during testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => {
    console.log(`🚀 OpenAI Microservice running on port ${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔒 CORS allowed origin: ${config.allowedOrigin}`);
    console.log(`⚡ Rate limit: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000} seconds`);
    console.log(`🌐 WebSocket proxy: ws://localhost:${PORT}${config.websocketPath}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 WebSocket stats: http://localhost:${PORT}/api/websocket/stats`);
    console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  });
}

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('🔌 WebSocket server closed');
  });
  
  // Cleanup all proxy connections
  websocketProxyService.cleanup();
  
  // Close HTTP server
  server.close(() => {
    console.log('🚀 HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
