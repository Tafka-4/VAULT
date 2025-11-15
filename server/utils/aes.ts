import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export type EncryptedPayload = {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
};

export function encryptWithKey(plaintext: Buffer, key: Buffer): EncryptedPayload {
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte key');
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
}

export function decryptWithKey(ciphertext: Buffer, iv: Buffer, tag: Buffer, key: Buffer): Buffer {
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte key');
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
