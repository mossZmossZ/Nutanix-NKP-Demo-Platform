import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM

// Derive a 32-byte key from the configured secret (any length) via SHA-256.
function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(env.credentialSecret).digest();
}

/** Encrypt a plaintext string. Output: base64(iv):base64(authTag):base64(ciphertext). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ":",
  );
}

/** Decrypt a payload produced by encryptSecret(). Throws if tampered or malformed. */
export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, deriveKey(), iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

/**
 * Decrypt a payload, tolerating legacy plaintext. Values written before
 * encryption-at-rest was added aren't in the `iv:tag:ct` format, so decryption
 * throws — in that case we return the input unchanged (it's plaintext). New
 * writes always encrypt, so those rows heal on the next password reset.
 */
export function safeDecryptSecret(payload: string): string {
  try {
    return decryptSecret(payload);
  } catch {
    return payload;
  }
}
