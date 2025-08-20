import WebSocket from 'ws';
import { config } from './src/config/config.js';

/**
 * Real AI Message Test
 * Test with properly formatted message to get actual AI responses
 */

const WEBSOCKET_URL = `ws://localhost:${config.port}${config.websocketPath}`;
const TEST_TOKEN = config.adminAccessSecret || 'test_token';

async function testRealAIMessage() {
  console.log('🤖 Testing Real AI Message Through Secure Proxy');
  console.log('='.repeat(60));
  
  return new Promise((resolve, reject) => {
    const authenticatedUrl = `${WEBSOCKET_URL}?token=${encodeURIComponent(TEST_TOKEN)}`;
    const ws = new WebSocket(authenticatedUrl);
    
    let responseReceived = false;
    let messageCount = 0;
    
    const timeout = setTimeout(() => {
      ws.close();
      console.log(`\n📊 Test completed. Received ${messageCount} messages.`);
      resolve(responseReceived);
    }, 15000);
    
    ws.on('open', () => {
      console.log('✅ Connected to secure proxy');
    });
    
    ws.on('message', (data) => {
      messageCount++;
      try {
        const message = JSON.parse(data.toString());
        
        console.log(`\n📨 Message ${messageCount}:`, {
          type: message.type,
          timestamp: message.timestamp || 'N/A',
          hasData: !!message.data,
          requestId: message.requestId || 'N/A'
        });
        
        if (message.type === 'connection') {
          console.log('🔗 Proxy connection established, sending AI message...');
          
          // Send properly formatted AI message
          const aiMessage = {
            type: 'text',
            requestId: 'real_ai_test_' + Date.now(),
            data: {
              model: 'gpt-4.1',
              text: 'Hello! Can you tell me a brief joke about programming?',
              messages: [],
              options: {
                agentId: 'e66ea468-98a4-40a9-a9fd-803a39574e0e',
                search_available: false,
                image_available: false,
                context_awareness: {},
                type: 'olivia_chat',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                phoneNumber: '',
                companyName: '',
                userData: null
              }
            }
          };
          
          console.log('📤 Sending:', {
            type: aiMessage.type,
            requestId: aiMessage.requestId,
            model: aiMessage.data.model,
            text: aiMessage.data.text.substring(0, 50) + '...'
          });
          
          ws.send(JSON.stringify(aiMessage));
        } else if (message.type === 'stream_chunk') {
          console.log('📝 Stream chunk received:', {
            requestId: message.requestId,
            chunkLength: message.data?.text?.length || 0
          });
          responseReceived = true;
        } else if (message.type === 'stream_complete') {
          console.log('✅ Stream complete:', {
            requestId: message.requestId,
            fullResponseLength: message.data?.fullResponse?.length || 0
          });
          responseReceived = true;
          
          if (message.data?.fullResponse) {
            console.log('🤖 AI Response:', message.data.fullResponse.substring(0, 200) + '...');
          }
        } else if (message.type === 'text' || message.type === 'response') {
          console.log('💬 Text response received:', {
            type: message.type,
            length: message.data?.length || 0
          });
          responseReceived = true;
        } else if (message.type === 'error') {
          console.log('❌ Error received:', {
            message: message.message,
            code: message.code
          });
        }
        
      } catch (error) {
        console.log(`📨 Raw message ${messageCount}:`, data.toString().substring(0, 100) + '...');
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.log('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      console.log(`🔌 Connection closed. Code: ${code}, Reason: ${reason}`);
      
      if (responseReceived) {
        console.log('\n🎉 SUCCESS: Real AI responses received through secure proxy!');
      } else {
        console.log('\n⚠️  No AI responses received, but connection worked');
      }
      
      resolve(responseReceived);
    });
  });
}

// Check server health first
async function checkHealth() {
  try {
    const response = await fetch(`http://localhost:${config.port}/api/health`);
    const data = await response.json();
    return data.success && data.status === 'healthy';
  } catch (error) {
    console.log('❌ Server not available:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.log('💡 Make sure the server is running: npm run dev');
    process.exit(1);
  }
  
  try {
    const success = await testRealAIMessage();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
