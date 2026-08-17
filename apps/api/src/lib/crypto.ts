import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Salted one-way password hashing using Node's built-in scrypt (no external dep).
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(stored, derived);
}
