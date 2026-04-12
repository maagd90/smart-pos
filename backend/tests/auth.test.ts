import '../tests/setup';
import { hashPassword, verifyPassword, generateAccessToken, verifyAccessToken, generateRefreshToken } from '../src/services/auth';
import { JwtPayload, Role } from '../src/types';

describe('Auth Service', () => {
  describe('Password hashing', () => {
    it('should hash password', async () => {
      const hash = await hashPassword('password123');
      expect(hash).not.toBe('password123');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const hash = await hashPassword('mypassword');
      const result = await verifyPassword('mypassword', hash);
      expect(result).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await hashPassword('mypassword');
      const result = await verifyPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    const payload: JwtPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: Role.CASHIER,
    };

    it('should generate and verify access token', () => {
      const token = generateAccessToken(payload);
      expect(token).toBeTruthy();
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should generate refresh token as UUID', () => {
      const token = generateRefreshToken();
      expect(token).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });
  });
});
