import WebSocket from 'ws';
import { config } from '../config/config.js';

/**
 * WebSocket Proxy Service
 * Acts as a secure proxy between frontend and external WebSocket service
 */
export class WebSocketProxyService {
  constructor() {
    this.connections = new Map(); // Track client connections
    this.externalWsEndpoints = config.externalWebsocketUrls;
    this.currentEndpointIndex = 0;
  }

  /**
   * Create WebSocket proxy connection for a client
   */
  createProxyConnection(clientWs, clientId) {
    console.log(`🔗 Creating proxy connection for client: ${clientId}`);
    
    // Check if external endpoints are configured
    if (!this.externalWsEndpoints || this.externalWsEndpoints.length === 0) {
      console.error(`🚨 No external WebSocket endpoints configured for client: ${clientId}`);
      this.sendErrorToClient(clientWs, 'External WebSocket endpoints not configured. Please set EXTERNAL_WEBSOCKET_URLS in environment.');
      return;
    }
    
    // Try to connect to external WebSocket
    const externalWsUrl = this.externalWsEndpoints[this.currentEndpointIndex];
    console.log(`🌐 Connecting to external WebSocket: ${externalWsUrl}`);
    
    const externalWs = new WebSocket(externalWsUrl);
    
    // Store connection info
    const connectionInfo = {
      clientWs,
      externalWs,
      clientId,
      connected: false,
      lastPing: Date.now(),
      externalWsUrl
    };
    
    this.connections.set(clientId, connectionInfo);

    // External WebSocket event handlers
    externalWs.on('open', () => {
      console.log(`✅ External WebSocket connected for client: ${clientId} to ${externalWsUrl}`);
      connectionInfo.connected = true;
      
      // Send connection established message to client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'connection',
          message: 'Secure proxy connection established',
          timestamp: new Date().toISOString(),
          externalUrl: externalWsUrl
        }));
      }
    });

    externalWs.on('message', (data) => {
      // Forward external WebSocket messages to client
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📨 Forwarding message to client ${clientId}:`, message.type || 'unknown');
          clientWs.send(data.toString());
        } catch (error) {
          console.error(`Error forwarding message to client ${clientId}:`, error);
          clientWs.send(data.toString()); // Forward as-is if parsing fails
        }
      }
    });

    externalWs.on('error', (error) => {
      console.error(`🚨 External WebSocket error for client ${clientId} (${externalWsUrl}):`, error.message);
      connectionInfo.connected = false;
      
      // Try next endpoint if available
      if (this.currentEndpointIndex < this.externalWsEndpoints.length - 1) {
        this.currentEndpointIndex++;
        console.log(`🔄 Trying next endpoint for client ${clientId}: ${this.externalWsEndpoints[this.currentEndpointIndex]}`);
        
        // Clean up current connection and retry
        this.cleanupConnection(clientId);
        setTimeout(() => {
          if (clientWs.readyState === WebSocket.OPEN) {
            this.createProxyConnection(clientWs, clientId);
          }
        }, 1000);
      } else {
        // All endpoints failed
        console.error(`🚨 All external endpoints failed for client ${clientId}`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'error',
            message: 'Failed to connect to AI service. All endpoints unavailable.',
            code: 'CONNECTION_FAILED',
            triedEndpoints: this.externalWsEndpoints
          }));
        }
        // Reset endpoint index for next client
        this.currentEndpointIndex = 0;
      }
    });

    externalWs.on('close', (code, reason) => {
      console.log(`🔌 External WebSocket closed for client ${clientId}. Code: ${code}, Reason: ${reason}`);
      connectionInfo.connected = false;
      
      // Notify client of disconnection
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'disconnection',
          message: 'External service connection closed',
          code: code,
          reason: reason.toString()
        }));
      }
    });

    // Client WebSocket event handlers
    clientWs.on('message', (data) => {
      // Forward client messages to external WebSocket
      if (connectionInfo.connected && externalWs.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📤 Forwarding message from client ${clientId}:`, message.type || 'unknown');
          externalWs.send(data.toString());
        } catch (error) {
          console.error(`Error forwarding message from client ${clientId}:`, error);
          externalWs.send(data.toString()); // Forward as-is if parsing fails
        }
      } else {
        // Queue message or send error if not connected
        console.warn(`⚠️ Cannot forward message from client ${clientId}: external connection not ready`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'error',
            message: 'External service not connected. Please wait...',
            code: 'SERVICE_UNAVAILABLE'
          }));
        }
      }
    });

    clientWs.on('close', () => {
      console.log(`👋 Client WebSocket closed: ${clientId}`);
      this.cleanupConnection(clientId);
    });

    clientWs.on('error', (error) => {
      console.error(`🚨 Client WebSocket error for ${clientId}:`, error);
      this.cleanupConnection(clientId);
    });

    return connectionInfo;
  }

  /**
   * Send error message to client
   */
  sendErrorToClient(clientWs, message) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: message,
        code: 'PROXY_ERROR'
      }));
    }
  }

  /**
   * Clean up a proxy connection
   */
  cleanupConnection(clientId) {
    const connectionInfo = this.connections.get(clientId);
    if (connectionInfo) {
      if (connectionInfo.externalWs && connectionInfo.externalWs.readyState === WebSocket.OPEN) {
        connectionInfo.externalWs.close();
      }
      this.connections.delete(clientId);
      console.log(`🧹 Cleaned up connection for client: ${clientId}`);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const activeConnections = Array.from(this.connections.values()).filter(
      conn => conn.connected && conn.clientWs.readyState === WebSocket.OPEN
    ).length;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      currentEndpoint: this.externalWsEndpoints[this.currentEndpointIndex],
      endpointIndex: this.currentEndpointIndex,
      availableEndpoints: this.externalWsEndpoints.length,
      externalEndpoints: this.externalWsEndpoints
    };
  }

  /**
   * Cleanup all connections (for server shutdown)
   */
  cleanup() {
    console.log('🧹 Cleaning up all WebSocket proxy connections...');
    for (const [clientId, connectionInfo] of this.connections.entries()) {
      if (connectionInfo.externalWs && connectionInfo.externalWs.readyState === WebSocket.OPEN) {
        connectionInfo.externalWs.close();
      }
      if (connectionInfo.clientWs && connectionInfo.clientWs.readyState === WebSocket.OPEN) {
        connectionInfo.clientWs.close();
      }
    }
    this.connections.clear();
  }
}

// Export singleton instance
export const websocketProxyService = new WebSocketProxyService();