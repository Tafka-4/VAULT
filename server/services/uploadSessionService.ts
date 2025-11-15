import fs from 'node:fs';
import { join, resolve } from 'pathe';
import { nanoid } from 'nanoid';
import { getAppConfig } from '../utils/config';
import { saveEncryptedFile } from './fileService';

const cfg = getAppConfig();
const uploadsRoot = resolve(cfg.dataDir, 'uploads');

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

function saveSession(session: UploadSession) {
  fs.writeFileSync(metaPath(session.id), JSON.stringify(session), 'utf8');
}

function loadSession(id: string): UploadSession {
  const path = metaPath(id);
  if (!fs.existsSync(path)) {
    throw new Error('업로드 세션을 찾을 수 없습니다.');
  }
  const raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw) as UploadSession;
}

export function createUploadSession(params: {
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  totalChunks: number;
  folderId?: string | null;
  description?: string;
}): UploadSession {
  const id = nanoid(21);
  const dir = sessionDir(id);
  fs.mkdirSync(dir, { recursive: true });
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
  saveSession(session);
  return session;
}

export function appendUploadChunk(options: {
  sessionId: string;
  userId: string;
  chunkIndex: number;
  data: Buffer;
}) {
  const session = loadSession(options.sessionId);
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
  fs.writeFileSync(dest, options.data);
  session.receivedChunks += 1;
  session.receivedBytes += options.data.length;
  saveSession(session);
}

export async function finalizeUploadSession(sessionId: string, userId: string) {
  const session = loadSession(sessionId);
  if (session.userId !== userId) {
    throw new Error('세션에 접근할 수 없습니다.');
  }
  if (session.receivedChunks !== session.totalChunks) {
    throw new Error('모든 청크가 업로드되지 않았습니다.');
  }
  if (session.receivedBytes !== session.size) {
    throw new Error('업로드된 크기가 예상과 다릅니다.');
  }
  const buffers: Buffer[] = [];
  for (let index = 0; index < session.totalChunks; index++) {
    const path = chunkPath(sessionId, index);
    if (!fs.existsSync(path)) {
      throw new Error('누락된 청크가 있습니다.');
    }
    buffers.push(fs.readFileSync(path));
  }
  const combined = Buffer.concat(buffers);
  const record = await saveEncryptedFile({
    userId: session.userId,
    name: session.name,
    mimeType: session.mimeType,
    buffer: combined,
    description: session.description,
    folderId: session.folderId,
  });
  cleanupSession(sessionId);
  return record;
}

export function cleanupSession(sessionId: string) {
  const dir = sessionDir(sessionId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function cancelUploadSession(sessionId: string, userId: string) {
  try {
    const session = loadSession(sessionId);
    if (session.userId !== userId) {
      throw new Error('세션을 찾을 수 없습니다.');
    }
    cleanupSession(sessionId);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '세션을 취소할 수 없습니다.');
  }
}
