/**
 * Manual JWT Testing Script
 * 
 * This script demonstrates how to manually test the JWT authentication functionality
 */

import { generateOliviaToken, generateCustomToken, verifyToken } from './tests/jwt-generator.js';

console.log('🔐 JWT Authentication Testing\n');

const TEST_SECRET = process.env.ADMIN_ACCESS_SECRET || 'your_secret_here';

// Generate test tokens
console.log('1. 📝 Generated Olivia Network AI Token:');
const oliviaToken = generateOliviaToken(TEST_SECRET);
console.log(`Bearer ${oliviaToken}\n`);

console.log('2. 🔍 Decoded Token Info:');
const decoded = verifyToken(oliviaToken, TEST_SECRET);
console.log(JSON.stringify(decoded, null, 2));

console.log('\n3. ✅ Test Commands:');
console.log('\n🏥 Health Check (No Auth Required):');
console.log('curl http://localhost:3001/api/health');

console.log('\n🔑 Token Info (Auth Required):');
console.log(`curl -H "Authorization: Bearer ${oliviaToken}" http://localhost:3001/api/openai/token-info`);

console.log('\n💬 Chat Completion (Auth Required):');
console.log(`curl -X POST http://localhost:3001/api/openai/chat/completions \\
  -H "Authorization: Bearer ${oliviaToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`);

console.log('\n🔄 Trading Parameter Extraction (Auth Required):');
console.log(`curl -X POST http://localhost:3001/api/openai/extract-trading \\
  -H "Authorization: Bearer ${oliviaToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "I want to buy 100 USD worth of TON"
  }'`);

console.log('\n⚠️  Environment Setup:');
console.log('Make sure to set these environment variables:');
console.log('ADMIN_ACCESS_SECRET=your_actual_secret_here');
console.log('NODE_ENV=production (to enable authentication)');
console.log('OPENAI_API_KEY=your_openai_key_here');

console.log('\n🧪 Run Unit Tests:');
console.log('npm test');
