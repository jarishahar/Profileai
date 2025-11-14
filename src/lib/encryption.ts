import crypto from "crypto";

/**
 * Encryption utility for sensitive data like API keys
 * Uses AES-256-GCM for authenticated encryption
 */

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM

/**
 * Derive a consistent encryption key from the secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET not set");
  }
  // Use SHA-256 to derive a consistent key from the secret
  return crypto
    .createHash("sha256")
    .update(secret)
    .digest()
    .slice(0, ENCRYPTION_KEY_LENGTH);
}

/**
 * Encrypt a value using AES-256-GCM
 */
export function encryptValue(value: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt value");
  }
}

/**
 * Decrypt a value encrypted with encryptValue()
 */
export function decryptValue(encrypted: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encrypted.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt value");
  }
}

/**
 * Mask a value for display (show first 4 and last 4 characters)
 */
export function maskValue(value: string, showChars: number = 4): string {
  if (value.length <= showChars * 2) {
    return "*".repeat(value.length);
  }
  const start = value.substring(0, showChars);
  const end = value.substring(value.length - showChars);
  const middle = "*".repeat(Math.max(10, value.length - showChars * 2));
  return `${start}${middle}${end}`;
}
