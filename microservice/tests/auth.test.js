import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Mock the config module
const mockConfig = {
  nodeEnv: 'test',
  adminAccessSecret: 'test_secret_key_12345'
};

jest.unstable_mockModule('../src/config/config.js', () => ({
  config: mockConfig
}));

const { authenticateAdmin } = await import('../src/middleware/auth.js');

describe('JWT Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      tokenInfo: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      mockConfig.nodeEnv = 'development';
    });

    afterEach(() => {
      mockConfig.nodeEnv = 'test';
    });

    it('should skip authentication in development mode', () => {
      authenticateAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('Production Mode', () => {
    it('should return 401 when authorization header is missing', () => {
      authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization header is required',
        code: 'UNAUTHORIZED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      req.headers.authorization = 'InvalidToken';

      authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization header must start with "Bearer "',
        code: 'INVALID_AUTH_FORMAT'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when JWT token is invalid', () => {
      req.headers.authorization = 'Bearer invalid_token';

      authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT token is expired', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { 
          client_id: 'test-client',
          role: 'test-role',
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        },
        mockConfig.adminAccessSecret
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should successfully authenticate with valid JWT token', () => {
      const payload = {
        client_id: 'edd02a7c-a48b-46b5-a321-9efb400edb43',
        role: 'God Mode',
        account_type: 'enterprise',
        account_status: 'active',
        company_name: 'Olivia Network AI',
        token_type: 'admin_access_token',
        issued_at: '2025-08-20T10:34:42.143Z',
        no_expiration: true
      };

      const validToken = jwt.sign(payload, mockConfig.adminAccessSecret, {
        noTimestamp: true // Don't add iat automatically since we have no_expiration
      });

      req.headers.authorization = `Bearer ${validToken}`;

      authenticateAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.tokenInfo).toEqual(payload);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle the specific Olivia Network AI token format', () => {
      // Test with the exact payload structure from the user's example
      const oliviaPayload = {
        client_id: 'edd02a7c-a48b-46b5-a321-9efb400edb43',
        role: 'God Mode',
        account_type: 'enterprise',
        account_status: 'active',
        company_name: 'Olivia Network AI',
        token_type: 'admin_access_token',
        issued_at: '2025-08-20T10:34:42.143Z',
        no_expiration: true,
        iat: 1755686082
      };

      const oliviaToken = jwt.sign(oliviaPayload, mockConfig.adminAccessSecret);

      req.headers.authorization = `Bearer ${oliviaToken}`;

      authenticateAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.tokenInfo).toEqual({
        client_id: 'edd02a7c-a48b-46b5-a321-9efb400edb43',
        role: 'God Mode',
        account_type: 'enterprise',
        account_status: 'active',
        company_name: 'Olivia Network AI',
        token_type: 'admin_access_token',
        issued_at: '2025-08-20T10:34:42.143Z',
        no_expiration: true
      });
    });

    it('should handle malformed JWT tokens gracefully', () => {
      req.headers.authorization = 'Bearer not.a.valid.jwt.format';

      authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT signed with wrong secret', () => {
      const payload = { client_id: 'test', role: 'admin' };
      const wrongSecretToken = jwt.sign(payload, 'wrong_secret');

      req.headers.authorization = `Bearer ${wrongSecretToken}`;

      authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
