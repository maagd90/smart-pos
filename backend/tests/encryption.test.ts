import '../tests/setup';
import { encrypt, decrypt } from '../src/services/encryption';

describe('Encryption Service', () => {
  it('should encrypt and decrypt a string', () => {
    const original = 'test-phone-number';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertext for same input', () => {
    const original = 'same-text';
    const enc1 = encrypt(original);
    const enc2 = encrypt(original);
    expect(enc1).not.toBe(enc2);
  });

  it('should throw on invalid format', () => {
    expect(() => decrypt('invalid')).toThrow();
  });

  it('should encrypt phone numbers', () => {
    const phone = '+1234567890';
    const encrypted = encrypt(phone);
    expect(encrypted).toContain(':');
    expect(decrypt(encrypted)).toBe(phone);
  });
});
