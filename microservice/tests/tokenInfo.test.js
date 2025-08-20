import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Mock the config module
const mockConfig = {
  nodeEnv: 'test',
  adminAccessSecret: 'test_secret_key_12345',
  openaiApiKey: 'test_openai_key',
  allowedOrigin: 'http://localhost:3000',
  port: 3002, // Use different port for testing
  rateLimitWindowMs: 900000,
  rateLimitMaxRequests: 100
};

jest.unstable_mockModule('../src/config/config.js', () => ({
  config: mockConfig
}));

// Import Express app without starting the server
const appModule = await import('../src/server.js');
const app = appModule.default;

describe('Token Info Endpoint', () => {
  const testSecret = 'test_secret_key_12345';
  
  const createValidToken = (payload = {}) => {
    const defaultPayload = {
      client_id: 'edd02a7c-a48b-46b5-a321-9efb400edb43',
      role: 'God Mode',
      account_type: 'enterprise',
      account_status: 'active',
      company_name: 'Olivia Network AI',
      token_type: 'admin_access_token',
      issued_at: '2025-08-20T10:34:42.143Z',
      no_expiration: true,
      ...payload
    };
    
    return jwt.sign(defaultPayload, testSecret);
  };

  describe('GET /api/openai/token-info', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .get('/api/openai/token-info')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Authorization header is required',
        code: 'UNAUTHORIZED'
      });
    });

    it('should return 401 when authorization header format is invalid', async () => {
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Authorization header must start with "Bearer "',
        code: 'INVALID_AUTH_FORMAT'
      });
    });

    it('should return 403 when JWT token is invalid', async () => {
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403);

      expect(response.body).toEqual({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    });

    it('should return token info when valid JWT is provided', async () => {
      const validToken = createValidToken();
      
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Token information retrieved successfully',
        data: {
          client_id: 'edd02a7c-a48b-46b5-a321-9efb400edb43',
          role: 'God Mode',
          account_type: 'enterprise',
          account_status: 'active',
          company_name: 'Olivia Network AI',
          token_type: 'admin_access_token',
          issued_at: '2025-08-20T10:34:42.143Z',
          no_expiration: true
        }
      });
    });

    it('should handle different token payloads correctly', async () => {
      const customPayload = {
        client_id: 'custom-client-123',
        role: 'Admin',
        account_type: 'basic',
        account_status: 'active',
        company_name: 'Test Company',
        token_type: 'admin_access_token',
        issued_at: '2025-01-01T00:00:00.000Z',
        no_expiration: false
      };

      const customToken = createValidToken(customPayload);
      
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', `Bearer ${customToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Token information retrieved successfully',
        data: customPayload
      });
    });

    it('should return 401 when token is expired', async () => {
      const expiredPayload = {
        client_id: 'test-client',
        role: 'Admin',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };

      const expiredToken = jwt.sign(expiredPayload, testSecret);
      
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    });

    it('should reject token signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { client_id: 'test', role: 'admin' },
        'wrong_secret_key'
      );
      
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(403);

      expect(response.body).toEqual({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    });
  });

  describe('CORS and Origin Validation', () => {
    it('should work with valid origin header', async () => {
      const validToken = createValidToken();
      
      const response = await request(app)
        .get('/api/openai/token-info')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
