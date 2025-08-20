/**
 * Frontend Integration Test
 * Tests that the frontend WebSocketContext is properly configured to use the microservice
 */

import { ENDPOINTS, OPENAI_MICROSERVICE_CONFIG } from './src/api/config/endpoints.js';

console.log('🧪 Frontend Integration Test');
console.log('='.repeat(50));

// Test 1: Configuration Check
console.log('\n📋 1. Configuration Check:');
console.log('   Secure WebSocket URL:', ENDPOINTS.WEBSOCKET.SECURE_PROXY);
console.log('   Microservice URL:', OPENAI_MICROSERVICE_CONFIG.URL);
console.log('   Has Auth Token:', !!OPENAI_MICROSERVICE_CONFIG.TOKEN);

// Test 2: Environment Variables
console.log('\n🌍 2. Environment Variables:');
console.log('   VITE_OPENAI_MICROSERVICE_URL:', process.env.VITE_OPENAI_MICROSERVICE_URL || 'NOT SET');
console.log('   VITE_OPENAI_MICROSERVICE_TOKEN:', process.env.VITE_OPENAI_MICROSERVICE_TOKEN ? 'SET' : 'NOT SET');

// Test 3: Endpoint Validation
console.log('\n🔍 3. Endpoint Validation:');
const expectedMicroserviceUrl = process.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001';
const expectedWebSocketUrl = expectedMicroserviceUrl.replace('http', 'ws') + '/ws/secure-proxy';

console.log('   Expected WebSocket URL:', expectedWebSocketUrl);
console.log('   Actual WebSocket URL:', ENDPOINTS.WEBSOCKET.SECURE_PROXY);
console.log('   URLs Match:', ENDPOINTS.WEBSOCKET.SECURE_PROXY === expectedWebSocketUrl ? '✅' : '❌');

// Test 4: Token Validation
console.log('\n🔑 4. Authentication Check:');
if (OPENAI_MICROSERVICE_CONFIG.TOKEN) {
  console.log('   Token configured: ✅');
  console.log('   Token length:', OPENAI_MICROSERVICE_CONFIG.TOKEN.length, 'characters');
} else {
  console.log('   Token configured: ❌');
  console.log('   ⚠️  Authentication will fail without token');
}

// Test 5: Microservice Health Check
console.log('\n🏥 5. Microservice Health Check:');
async function checkMicroserviceHealth() {
  try {
    const healthUrl = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/health`;
    console.log('   Checking:', healthUrl);
    
    const response = await fetch(healthUrl);
    const data = await response.json();
    
    if (data.success && data.status === 'healthy') {
      console.log('   Microservice Status: ✅ HEALTHY');
      console.log('   Service:', data.service);
      console.log('   OpenAI Configured:', data.openai_configured ? '✅' : '❌');
    } else {
      console.log('   Microservice Status: ❌ UNHEALTHY');
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('   Microservice Status: ❌ UNREACHABLE');
    console.log('   Error:', error.message);
    console.log('   💡 Make sure microservice is running: cd openai-microservice && npm run dev');
  }
}

// Test 6: WebSocket Connection Test
console.log('\n🔌 6. WebSocket Connection Test:');
async function testWebSocketConnection() {
  if (!OPENAI_MICROSERVICE_CONFIG.TOKEN) {
    console.log('   WebSocket Test: ❌ SKIPPED (No auth token)');
    return;
  }
  
  try {
    const wsUrl = `${ENDPOINTS.WEBSOCKET.SECURE_PROXY}?token=${encodeURIComponent(OPENAI_MICROSERVICE_CONFIG.TOKEN)}`;
    console.log('   Connecting to:', ENDPOINTS.WEBSOCKET.SECURE_PROXY);
    
    // Import WebSocket for Node.js environment
    const WebSocket = await import('ws').then(m => m.default);
    const ws = new WebSocket(wsUrl);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        console.log('   WebSocket Test: ❌ TIMEOUT');
        resolve(false);
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('   WebSocket Test: ✅ CONNECTION SUCCESSFUL');
        ws.close();
        resolve(true);
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.log('   WebSocket Test: ❌ CONNECTION FAILED');
        console.log('   Error:', error.message);
        resolve(false);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'connection') {
            console.log('   Proxy Response: ✅ CONNECTION MESSAGE RECEIVED');
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    });
  } catch (error) {
    console.log('   WebSocket Test: ❌ SETUP FAILED');
    console.log('   Error:', error.message);
    return false;
  }
}

// Run all tests
async function runIntegrationTests() {
  console.log('\n🚀 Running Integration Tests...');
  
  await checkMicroserviceHealth();
  const wsSuccess = await testWebSocketConnection();
  
  console.log('\n📊 Integration Test Summary:');
  console.log('='.repeat(30));
  
  const configOk = !!ENDPOINTS.WEBSOCKET.SECURE_PROXY && !!OPENAI_MICROSERVICE_CONFIG.URL;
  const tokenOk = !!OPENAI_MICROSERVICE_CONFIG.TOKEN;
  
  console.log(`   Configuration: ${configOk ? '✅' : '❌'}`);
  console.log(`   Authentication: ${tokenOk ? '✅' : '❌'}`);
  console.log(`   WebSocket Connection: ${wsSuccess ? '✅' : '❌'}`);
  
  if (configOk && tokenOk && wsSuccess) {
    console.log('\n🎉 Frontend successfully configured to use secure microservice!');
  } else {
    console.log('\n⚠️  Integration issues detected. Check the steps above.');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(console.error);
}

export { runIntegrationTests };
