import { hash, compare } from "bcryptjs";

const ROUNDS = 10;

/** Hash a plaintext password for storage. */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

/** Verify a plaintext password against a stored hash. */
export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}
