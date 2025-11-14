// lib/security/tokens.ts
import { createHash, randomBytes } from "node:crypto";

export function generateRawToken(size = 32) {
  return randomBytes(size).toString("base64url");
}
export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("base64url");
}
