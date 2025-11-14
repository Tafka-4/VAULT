import crypto from 'node:crypto';
import { getAppConfig } from './config';

const CHANGE_TIME_MS = 60 * 30 * 1000; // 30 minutes

function mix(base1: Buffer, base2: Buffer): Buffer {
  const mixed = Buffer.alloc(Math.max(base1.length, base2.length));
  for (let i = 0; i < mixed.length; i++) {
    mixed[i] = base1[i % base1.length] ^ base2[i % base2.length];
  }
  return mixed;
}

function getRegistrationSeed(): string {
  const seed = getAppConfig().registrationSeed;
  if (!seed) {
    throw new Error('REGISTRATION_SEED must be set to validate verification codes.');
  }
  return seed;
}

function deriveCompanionSecret(seed: string): string {
  return crypto.createHash('sha256').update(`${seed}:companion`).digest('hex');
}

function computeCode(offsetWindows = 0): string {
  const seed = getRegistrationSeed();
  const primarySecret = Buffer.from(seed);
  const companionSecret = Buffer.from(deriveCompanionSecret(seed));
  const now = Date.now() + offsetWindows * CHANGE_TIME_MS;
  const timeWindow = Math.floor(now / CHANGE_TIME_MS);
  const timeSalt = crypto.createHash('sha256').update(timeWindow.toString()).digest('hex');
  const mixedSecret = mix(primarySecret, companionSecret);
  const finalKey = crypto.createHash('sha256').update(`${mixedSecret.toString('hex')}:${timeSalt}`).digest('hex');
  return `Vault{${finalKey}}`;
}

export function currentVerificationCode(): string {
  return computeCode(0);
}

export function isValidVerificationCode(code: string): boolean {
  const trimmed = code.trim();
  const candidates = [computeCode(0), computeCode(-1), computeCode(1)];
  return candidates.includes(trimmed);
}
