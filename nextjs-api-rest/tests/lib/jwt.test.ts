import { generateToken, verifyToken } from '@/lib/jwt';

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'USER'
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'USER'
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('USER');
    });

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for tampered token', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'USER'
      };

      const token = generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const result = verifyToken(tamperedToken);

      expect(result).toBeNull();
    });
  });
});
