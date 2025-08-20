/**
 * JWT Token Generator for Testing
 * 
 * This utility generates JWT tokens for testing the authentication middleware
 */

import jwt from 'jsonwebtoken';

const TEST_SECRET = process.env.ADMIN_ACCESS_SECRET || 'your_secret_here';

/**
 * Generate a valid Olivia Network AI JWT token
 */
export function generateOliviaToken(secret = TEST_SECRET) {
  const payload = {
    client_id: process.env.CLIENT_ID || 'your_client_id_here',
    role: 'God Mode',
    account_type: 'enterprise',
    account_status: 'active',
    company_name: 'Olivia Network AI',
    token_type: 'admin_access_token',
    issued_at: '2025-08-20T10:34:42.143Z',
    no_expiration: true,
    iat: 1755686082
  };

  return jwt.sign(payload, secret);
}

/**
 * Generate a custom JWT token with specified payload
 */
export function generateCustomToken(payload, secret = TEST_SECRET, options = {}) {
  return jwt.sign(payload, secret, options);
}

/**
 * Generate an expired JWT token
 */
export function generateExpiredToken(secret = TEST_SECRET) {
  const payload = {
    client_id: 'test-client',
    role: 'Admin',
    exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
  };

  return jwt.sign(payload, secret);
}

/**
 * Decode a JWT token (for testing purposes)
 */
export function decodeToken(token) {
  return jwt.decode(token, { complete: true });
}

/**
 * Verify a JWT token with a secret
 */
export function verifyToken(token, secret = TEST_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return { error: error.message, name: error.name };
  }
}

// CLI usage when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔑 JWT Token Generator for Testing\n');
  
  console.log('📝 Olivia Network AI Token:');
  const oliviaToken = generateOliviaToken();
  console.log(`Bearer ${oliviaToken}\n`);
  
  console.log('🔍 Decoded Payload:');
  console.log(JSON.stringify(decodeToken(oliviaToken).payload, null, 2));
  
  console.log('\n✅ Test this token with:');
  console.log(`curl -H "Authorization: Bearer ${oliviaToken}" http://localhost:3001/api/openai/token-info`);
  
  console.log('\n⚠️  Remember to set ADMIN_ACCESS_SECRET=your_actual_secret_here in your .env file');
}
