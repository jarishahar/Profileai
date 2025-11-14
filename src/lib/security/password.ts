// lib/security/password.ts
import * as bcrypt from "bcrypt-ts";

// Use at least 12; 12–14 is common in prod
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(hash: string, plain: string) {
  return bcrypt.compare(plain, hash);
}
