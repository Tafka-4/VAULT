import fs from 'node:fs';
import { resolve } from 'pathe';
import { customAlphabet } from 'nanoid';

export type AppConfig = {
  dataDir: string;
  dbPath: string;
  chunkSize: number;
  sessionTtlMs: number;
  kmsBaseUrl: string;
  kmsClientToken: string;
  kmsRequestTimeoutMs: number;
  registrationSeed: string;
};

const tokenAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const createToken = customAlphabet(tokenAlphabet, 40);

let cached: AppConfig | null = null;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SESSION_DAYS = 14;
const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64 KiB fits the KMS plaintext limit comfortably
const MAX_CHUNK_ALLOWED = 98_000;

export function getAppConfig(): AppConfig {
  if (cached) return cached;

  let dataDir = process.env.STORAGE_DATA_DIR
    ? resolve(process.env.STORAGE_DATA_DIR)
    : resolve(process.cwd(), 'server/.data');

  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (error) {
    if (process.env.STORAGE_DATA_DIR) {
      const fallback = resolve(process.cwd(), 'server/.data');
      fs.mkdirSync(fallback, { recursive: true });
      // eslint-disable-next-line no-console
      console.warn(`[config] Unable to use STORAGE_DATA_DIR=${dataDir}, falling back to ${fallback}`, error);
      dataDir = fallback;
    } else {
      throw error;
    }
  }

  const chunkSizeEnv = Number(process.env.STORAGE_CHUNK_SIZE);
  const chunkSize = Number.isFinite(chunkSizeEnv) && chunkSizeEnv > 1024
    ? Math.min(chunkSizeEnv, MAX_CHUNK_ALLOWED)
    : DEFAULT_CHUNK_SIZE;

  const sessionDaysEnv = Number(process.env.STORAGE_SESSION_TTL_DAYS);
  const sessionDays = Number.isFinite(sessionDaysEnv) && sessionDaysEnv > 0 ? sessionDaysEnv : DEFAULT_SESSION_DAYS;

  const requestTimeoutEnv = Number(process.env.KMS_REQUEST_TIMEOUT_MS);
  const kmsRequestTimeoutMs = Number.isFinite(requestTimeoutEnv) && requestTimeoutEnv >= 1000
    ? requestTimeoutEnv
    : 10000;
  const registrationSeed = process.env.REGISTRATION_SEED || '';

  cached = {
    dataDir,
    dbPath: resolve(dataDir, 'vault.db'),
    chunkSize,
    sessionTtlMs: sessionDays * DAY_MS,
    kmsBaseUrl: process.env.KMS_BASE_URL || 'http://localhost:3000',
    kmsClientToken: process.env.KMS_CLIENT_TOKEN || createToken(),
    kmsRequestTimeoutMs,
    registrationSeed,
  };

  return cached;
}
