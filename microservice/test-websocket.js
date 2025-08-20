import WebSocket from 'ws';
import { config } from './src/config/config.js';

/**
 * Test WebSocket Proxy Connection
 * This script tests the secure WebSocket proxy functionality
 */

const WEBSOCKET_URL = `ws://localhost:${config.port}${config.websocketPath}`;
const TEST_TOKEN = config.adminAccessSecret || 'test_token';

console.log('🧪 Testing WebSocket Secure Proxy');
console.log('='.repeat(50));
console.log(`📍 WebSocket URL: ${WEBSOCKET_URL}`);
console.log(`🔑 Using token: ${TEST_TOKEN ? 'Yes' : 'No'}`);
console.log(`🌍 Environment: ${config.nodeEnv}`);

/**
 * Test WebSocket connection with authentication
 */
async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    // Add token as query parameter for authentication
    const authenticatedUrl = `${WEBSOCKET_URL}?token=${encodeURIComponent(TEST_TOKEN)}`;
    
    console.log('\n🔌 Establishing WebSocket connection...');
    const ws = new WebSocket(authenticatedUrl);
    
    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      console.log('❌ Connection timeout');
      ws.close();
      reject(new Error('Connection timeout'));
    }, 10000);
    
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      console.log('✅ WebSocket connection established');
      
      // Send test message
      const testMessage = {
        type: 'text',
        requestId: 'test_123',
        data: {
          model: 'gpt-3.5-turbo',
          text: 'Hello, this is a test message',
          messages: [],
          options: {
            agentId: 'e66ea468-98a4-40a9-a9fd-803a39574e0e'
          }
        }
      };
      
      console.log('📤 Sending test message...');
      ws.send(JSON.stringify(testMessage));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', {
          type: message.type,
          timestamp: message.timestamp || 'N/A',
          hasData: !!message.data,
          status: message.status || 'N/A'
        });
        
        // If we get a connection message, consider test successful
        if (message.type === 'connection') {
          console.log('✅ Proxy connection working correctly');
          setTimeout(() => {
            ws.close();
            resolve(true);
          }, 2000);
        }
      } catch (error) {
        console.log('📨 Received raw message:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      console.log('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason}`);
      resolve(false);
    });
  });
}

/**
 * Test health check endpoint
 */
async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing health check endpoint...');
    const response = await fetch(`http://localhost:${config.port}/api/health`);
    const data = await response.json();
    
    if (data.success && data.status === 'healthy') {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

/**
 * Test WebSocket statistics endpoint
 */
async function testWebSocketStats() {
  try {
    console.log('\n📊 Testing WebSocket statistics endpoint...');
    const response = await fetch(`http://localhost:${config.port}/api/websocket/stats`);
    const data = await response.json();
    
    if (data.success && data.websocket_stats) {
      console.log('✅ WebSocket stats retrieved:', {
        totalConnections: data.websocket_stats.totalConnections,
        activeConnections: data.websocket_stats.activeConnections,
        currentEndpoint: data.websocket_stats.currentEndpoint
      });
      return true;
    } else {
      console.log('❌ WebSocket stats failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ WebSocket stats error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    console.log('\n🚀 Starting WebSocket Proxy Tests');
    
    // Test 1: Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('❌ Server not ready. Make sure it\'s running: npm run dev');
      process.exit(1);
    }
    
    // Test 2: WebSocket Stats
    await testWebSocketStats();
    
    // Test 3: WebSocket Connection
    const wsConnectionOk = await testWebSocketConnection();
    
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(30));
    console.log(`🏥 Health Check: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔌 WebSocket Connection: ${wsConnectionOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (healthOk && wsConnectionOk) {
      console.log('\n🎉 All tests passed! WebSocket proxy is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testWebSocketConnection, testHealthCheck, testWebSocketStats };
