import crypto from 'crypto';

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const rawKey = crypto.randomBytes(32).toString('hex');
  const prefix = 'sk_live_';
  const key = `${prefix}${rawKey}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hash, prefix };
}

export function generatePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const charsetLen = charset.length;
  // Reject bytes that would cause bias, ensuring uniform distribution
  const maxUnbiased = 256 - (256 % charsetLen);
  const result: string[] = [];
  while (result.length < length) {
    const bytes = crypto.randomBytes(length * 2);
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      if (bytes[i] < maxUnbiased) {
        result.push(charset[bytes[i] % charsetLen]);
      }
    }
  }
  return result.join('');
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

export function generateDomain(name: string, baseDomain = 'smartpos.app'): string {
  const slug = generateSlug(name);
  return `${slug}.${baseDomain}`;
}
