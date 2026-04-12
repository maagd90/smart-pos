import '../tests/setup';
import { encrypt, decrypt } from '../src/services/encryption';

describe('Encryption Service', () => {
  // ─── POSITIVE SCENARIOS ───────────────────────────────────────────────────

  describe('POSITIVE: Encryption and Decryption', () => {
    it('should encrypt and decrypt a string', () => {
      const original = 'test-phone-number';
      const encrypted = encrypt(original);
      expect(encrypted).not.toBe(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same input (random IV)', () => {
      const original = 'same-text';
      const enc1 = encrypt(original);
      const enc2 = encrypt(original);
      expect(enc1).not.toBe(enc2);
    });

    it('should encrypt phone numbers', () => {
      const phone = '+1234567890';
      const encrypted = encrypt(phone);
      expect(encrypted).toContain(':');
      expect(decrypt(encrypted)).toBe(phone);
    });

    it('should encrypt Twilio Account SID', () => {
      const sid = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      const encrypted = encrypt(sid);
      expect(decrypt(encrypted)).toBe(sid);
    });

    it('should encrypt Twilio Auth Token', () => {
      const token = 'auth_token_32_chars_here_abcdefgh';
      const encrypted = encrypt(token);
      expect(decrypt(encrypted)).toBe(token);
    });

    it('should handle special characters in plaintext', () => {
      const special = '!@#$%^&*()_+-=[]{}|;\':",.<>?/`~';
      const encrypted = encrypt(special);
      expect(decrypt(encrypted)).toBe(special);
    });

    it('should handle unicode characters', () => {
      const unicode = 'こんにちは 你好 Привет مرحبا';
      const encrypted = encrypt(unicode);
      expect(decrypt(encrypted)).toBe(unicode);
    });

    it('should handle emojis', () => {
      const emojis = '😀🎉🚀💰📱';
      const encrypted = encrypt(emojis);
      expect(decrypt(encrypted)).toBe(emojis);
    });

    it('should handle empty string', () => {
      const empty = '';
      const encrypted = encrypt(empty);
      expect(decrypt(encrypted)).toBe(empty);
    });

    it('should encrypt output in iv:authTag:encrypted format', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32); // 16 bytes auth tag = 32 hex chars
    });

    it('should handle a large payload (>1KB)', () => {
      const large = 'A'.repeat(1024);
      const encrypted = encrypt(large);
      expect(decrypt(encrypted)).toBe(large);
    });

    it('should handle a 10KB payload', () => {
      const large = 'B'.repeat(10 * 1024);
      const encrypted = encrypt(large);
      expect(decrypt(encrypted)).toBe(large);
    });

    it('should run concurrent encryptions without collision', () => {
      const inputs = Array.from({ length: 10 }, (_, i) => `secret-value-${i}`);
      const encrypted = inputs.map((text) => encrypt(text));
      // All encrypted values should be unique
      const uniqueEncrypted = new Set(encrypted);
      expect(uniqueEncrypted.size).toBe(inputs.length);
      // All should decrypt correctly
      encrypted.forEach((enc, i) => {
        expect(decrypt(enc)).toBe(inputs[i]);
      });
    });

    it('should handle binary-like data (base64 string)', () => {
      const binary = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE]).toString('base64');
      const encrypted = encrypt(binary);
      expect(decrypt(encrypted)).toBe(binary);
    });
  });

  // ─── NEGATIVE SCENARIOS ───────────────────────────────────────────────────

  describe('NEGATIVE: Tampered or Invalid Data', () => {
    it('should throw on invalid format (too few parts)', () => {
      expect(() => decrypt('invalid')).toThrow();
    });

    it('should throw when IV is tampered', () => {
      const encrypted = encrypt('secret');
      const parts = encrypted.split(':');
      parts[0] = 'a'.repeat(32); // Replace IV with different value
      const tampered = parts.join(':');
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw when auth tag is tampered (GCM authentication fails)', () => {
      const encrypted = encrypt('secret');
      const parts = encrypted.split(':');
      parts[1] = 'b'.repeat(32); // Replace auth tag
      const tampered = parts.join(':');
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw when ciphertext is tampered', () => {
      const encrypted = encrypt('secret');
      const parts = encrypted.split(':');
      // Flip a bit in the ciphertext
      const hex = parts[2];
      const flipped = (parseInt(hex[0], 16) ^ 1).toString(16) + hex.slice(1);
      parts[2] = flipped;
      const tampered = parts.join(':');
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw for completely invalid ciphertext', () => {
      expect(() => decrypt('not:valid:ciphertext')).toThrow();
    });

    it('should throw for empty encrypted string', () => {
      expect(() => decrypt('')).toThrow();
    });

    it('should throw when ENCRYPTION_KEY is wrong', () => {
      const encrypted = encrypt('secret data');

      // Temporarily change the key
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'wrong-key-here-that-is-32-bytes!';

      expect(() => decrypt(encrypted)).toThrow();

      // Restore key
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw when trying to decrypt non-hex encoded data', () => {
      const nonHex = 'gggg:hhhh:iiii'; // Not valid hex
      expect(() => decrypt(nonHex)).toThrow();
    });
  });
});
