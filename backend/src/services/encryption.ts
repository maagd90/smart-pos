import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives a 32-byte key from the environment variable ENCRYPTION_KEY.
 * Uses SHA-256 so any key length input works safely.
 */
function getKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY || '';
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.createHash('sha256').update(rawKey).digest().slice(0, KEY_LENGTH);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:ciphertext (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a string produced by `encrypt`.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Safely decrypts a nullable field. Returns null if value is null/undefined.
 */
export function decryptNullable(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return decrypt(value);
  } catch {
    return null;
  }
}
