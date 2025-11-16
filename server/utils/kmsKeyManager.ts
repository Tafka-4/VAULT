import { promises as fsp } from 'node:fs';
import { dirname, resolve } from 'pathe';
import { getAppConfig } from './config';
import { kmsClient } from './kmsClient';

type KmsKeyInfo = {
  keyId: string;
  version: number;
};

const cfg = getAppConfig();
const keyFilePath = resolve(cfg.dataDir, 'kms-key.json');
let cachedKey: KmsKeyInfo | null = null;

export async function getActiveKmsKey(): Promise<KmsKeyInfo> {
  if (cachedKey) return cachedKey;
  const disk = await readFromDisk();
  if (disk) {
    cachedKey = disk;
    return disk;
  }
  const freshlyGenerated = await kmsClient.generatePersistentKey();
  cachedKey = freshlyGenerated;
  await writeToDisk(freshlyGenerated);
  return freshlyGenerated;
}

export async function updateActiveKmsKey(info: KmsKeyInfo) {
  cachedKey = info;
  await writeToDisk(info);
}

async function readFromDisk(): Promise<KmsKeyInfo | null> {
  try {
    const raw = await fsp.readFile(keyFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed?.keyId === 'string' && typeof parsed?.version === 'number') {
      return { keyId: parsed.keyId, version: parsed.version };
    }
    return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeToDisk(info: KmsKeyInfo) {
  await fsp.mkdir(dirname(keyFilePath), { recursive: true });
  const payload = JSON.stringify(info, null, 2);
  await fsp.writeFile(keyFilePath, payload, 'utf8');
}
