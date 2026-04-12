import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32ch';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok!!';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-for-testing-ok!';
process.env.NODE_ENV = 'test';
