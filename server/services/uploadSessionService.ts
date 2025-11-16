import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import { join, resolve } from 'pathe';
import { nanoid } from 'nanoid';
import { randomBytes } from 'node:crypto';
import { getAppConfig } from '../utils/config';
import { persistEncryptedChunks, getFileById } from './fileService';
import { kmsClient } from '../utils/kmsClient';
import { encryptionPool } from '../utils/encryptionPool';

const cfg = getAppConfig();
const uploadsRoot = resolve(cfg.dataDir, 'uploads');
const sessionKeys = new Map<string, Buffer>();
const sessionCache = new Map<string, UploadSession>();

export type UploadSession = {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  description?: string;
  totalChunks: number;
  receivedChunks: number;
  receivedBytes: number;
  createdAt: number;
  fileId?: string;
  finalizedAt?: number;
};

function ensureRoot() {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

function sessionDir(id: string) {
  ensureRoot();
  return join(uploadsRoot, id);
}

function metaPath(id: string) {
  return join(sessionDir(id), 'meta.json');
}

function chunkPath(id: string, index: number) {
  return join(sessionDir(id), `chunk-${index}.part`);
}

async function saveSession(session: UploadSession) {
  sessionCache.set(session.id, session);
  await fsp.writeFile(metaPath(session.id), JSON.stringify(session), 'utf8');
}

async function loadSession(id: string): Promise<UploadSession> {
  const cached = sessionCache.get(id);
  if (cached) {
    return cached;
  }
  try {
    const raw = await fsp.readFile(metaPath(id), 'utf8');
    const session = JSON.parse(raw) as UploadSession;
    sessionCache.set(id, session);
    return session;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      throw new Error('업로드 세션을 찾을 수 없습니다.');
    }
    throw error;
  }
}

export async function createUploadSession(params: {
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  totalChunks: number;
  folderId?: string | null;
  description?: string;
}): Promise<UploadSession> {
  const id = nanoid(21);
  const dir = sessionDir(id);
  fs.mkdirSync(dir, { recursive: true });
  sessionKeys.set(id, randomBytes(32));
  const session: UploadSession = {
    id,
    userId: params.userId,
    name: params.name,
    mimeType: params.mimeType,
    size: params.size,
    folderId: params.folderId ?? null,
    description: params.description,
    totalChunks: params.totalChunks,
    receivedChunks: 0,
    receivedBytes: 0,
    createdAt: Date.now(),
  };
  await saveSession(session);
  return session;
}

export async function appendUploadChunk(options: {
  sessionId: string;
  userId: string;
  chunkIndex: number;
  data: Buffer;
}) {
  const receivedAt = Date.now();
  const session = await loadSession(options.sessionId);
  if (session.userId !== options.userId) {
    throw new Error('세션에 접근할 수 없습니다.');
  }
  if (session.receivedChunks >= session.totalChunks) {
    throw new Error('모든 청크가 이미 업로드되었습니다.');
  }
  if (options.chunkIndex < 0 || options.chunkIndex >= session.totalChunks) {
    throw new Error('잘못된 청크 인덱스입니다.');
  }
  const dest = chunkPath(options.sessionId, options.chunkIndex);
  if (fs.existsSync(dest)) {
    throw new Error('이미 업로드된 청크입니다.');
  }
  const dataKey = sessionKeys.get(options.sessionId);
  if (!dataKey) {
    throw new Error('업로드 세션 키를 찾을 수 없습니다. 다시 업로드해주세요.');
  }
  const encryptStart = performance.now();
  const encrypted = await encryptionPool.encrypt(options.data, dataKey);
  const encryptElapsed = performance.now() - encryptStart;
  const payload = Buffer.concat([encrypted.iv, encrypted.tag, encrypted.ciphertext]);
  const writeStart = performance.now();
  await fsp.writeFile(dest, payload);
  const writeElapsed = performance.now() - writeStart;
  session.receivedChunks += 1;
  session.receivedBytes += options.data.length;
  await saveSession(session);
  console.info('[upload] chunk stored', {
    sessionId: options.sessionId,
    chunkIndex: options.chunkIndex,
    chunkBytes: options.data.length,
    encryptMs: Number(encryptElapsed.toFixed(2)),
    writeMs: Number(writeElapsed.toFixed(2)),
    endToEndMs: Date.now() - receivedAt,
    receivedChunks: session.receivedChunks,
    totalChunks: session.totalChunks,
  });
}

export async function finalizeUploadSession(sessionId: string, userId: string) {
  const finalizeStartedAt = Date.now();
  const session = await loadSession(sessionId);
  if (session.userId !== userId) {
    throw new Error('세션에 접근할 수 없습니다.');
  }
  if (!session.fileId) {
    session.fileId = nanoid(21);
    await saveSession(session);
  }
  const fileId = session.fileId;
  const existingRecord = getFileById(fileId, session.userId);
  if (existingRecord) {
    console.info('[upload] session already finalized', {
      sessionId,
      fileId: existingRecord.id,
      totalChunks: existingRecord.totalChunks,
      totalBytes: existingRecord.size,
    });
    cleanupSession(sessionId);
    return existingRecord;
  }
  if (session.receivedChunks !== session.totalChunks) {
    throw new Error('모든 청크가 업로드되지 않았습니다.');
  }
  if (session.receivedBytes !== session.size) {
    throw new Error('업로드된 크기가 예상과 다릅니다.');
  }
  const dataKey = sessionKeys.get(sessionId);
  if (!dataKey) {
    throw new Error('업로드 세션 키를 찾을 수 없습니다.');
  }
  console.info('[upload] finalizing session', { sessionId, totalChunks: session.totalChunks, totalBytes: session.size });
  const encryptedChunks = [];
  for (let index = 0; index < session.totalChunks; index++) {
    const path = chunkPath(sessionId, index);
    if (!fs.existsSync(path)) {
      throw new Error('누락된 청크가 있습니다.');
    }
    const payload = fs.readFileSync(path);
    if (payload.length < 28) {
      throw new Error('손상된 청크 데이터를 발견했습니다.');
    }
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const ciphertext = payload.subarray(28);
    encryptedChunks.push({
      id: nanoid(21),
      chunkIndex: index,
      iv,
      tag,
      ciphertext,
      size: ciphertext.length,
    });
  }
  const wrappedKey = await kmsClient.encrypt(dataKey);
  dataKey.fill(0);
  sessionKeys.delete(sessionId);
  let record;
  try {
    record = await persistEncryptedChunks({
      userId: session.userId,
      name: session.name,
      mimeType: session.mimeType,
      size: session.size,
      description: session.description,
      folderId: session.folderId,
      wrappedKey,
      chunks: encryptedChunks,
      fileId,
    });
  } catch (error) {
    const constraintCode = (error as { code?: string })?.code;
    if (constraintCode && constraintCode.startsWith('SQLITE_CONSTRAINT')) {
      const duplicateRecord = getFileById(fileId, session.userId);
      if (duplicateRecord) {
        console.warn('[upload] detected duplicate finalize, returning existing file', {
          sessionId,
          fileId: duplicateRecord.id,
        });
        cleanupSession(sessionId);
        return duplicateRecord;
      }
    }
    throw error;
  }
  session.finalizedAt = Date.now();
  await saveSession(session);
  cleanupSession(sessionId);
  console.info('[upload] session finalized', {
    sessionId,
    totalChunks: session.totalChunks,
    totalBytes: session.size,
    durationMs: Date.now() - finalizeStartedAt,
  });
  return record;
}

export function cleanupSession(sessionId: string) {
  const dir = sessionDir(sessionId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  sessionCache.delete(sessionId);
  const key = sessionKeys.get(sessionId);
  if (key) {
    key.fill(0);
    sessionKeys.delete(sessionId);
  }
}

export async function cancelUploadSession(sessionId: string, userId: string) {
  try {
    const session = await loadSession(sessionId);
    if (session.userId !== userId) {
      throw new Error('세션을 찾을 수 없습니다.');
    }
    cleanupSession(sessionId);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '세션을 취소할 수 없습니다.');
  }
}
