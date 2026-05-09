import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";

function encryptionKey(): Buffer {
  const b64 = process.env.PLUGGY_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!b64) {
    throw new Error("PLUGGY_CREDENTIALS_ENCRYPTION_KEY is required for Pluggy connection persistence.");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("PLUGGY_CREDENTIALS_ENCRYPTION_KEY must decode to 32 bytes (AES-256).");
  }
  return key;
}

/** iv (12) + tag (16) + ciphertext → base64 */
export function encryptPluggyEnvelope(plainUtf8: string): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plainUtf8, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptPluggyEnvelope(b64: string): string {
  const key = encryptionKey();
  const buf = Buffer.from(b64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
