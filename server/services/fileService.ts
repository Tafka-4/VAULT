import { randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import db from '../utils/db';
import { getAppConfig } from '../utils/config';
import { chunkBuffer } from '../utils/chunk';
import { kmsClient } from '../utils/kmsClient';
import { encryptionPool } from '../utils/encryptionPool';
import { getActiveKmsKey } from '../utils/kmsKeyManager';
import { recordActivityLog } from './activityLogService';

const cfg = getAppConfig();

export type FileRecord = {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string | null;
  folderId?: string | null;
  wrappedKeyIv?: Buffer | null;
  wrappedKeyTag?: Buffer | null;
  wrappedKeyCiphertext?: Buffer | null;
  wrappedKeyId?: string | null;
  wrappedKeyVersion?: number | null;
  totalChunks: number;
  createdAt: number;
  updatedAt: number;
};

export type FileChunkRecord = {
  id: string;
  fileId: string;
  chunkIndex: number;
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
  size: number;
  createdAt: number;
};

const FILE_COLUMNS = `
  id, userId, name, mimeType, size, description, folderId,
  wrappedKeyIv, wrappedKeyTag, wrappedKeyCiphertext, wrappedKeyId, wrappedKeyVersion,
  totalChunks, createdAt, updatedAt
`;

const insertFileStmt = db.prepare(`
  INSERT INTO files (id, userId, name, mimeType, size, description, folderId, wrappedKeyIv, wrappedKeyTag, wrappedKeyCiphertext, wrappedKeyId, wrappedKeyVersion, totalChunks, createdAt, updatedAt)
  VALUES (@id, @userId, @name, @mimeType, @size, @description, @folderId, @wrappedKeyIv, @wrappedKeyTag, @wrappedKeyCiphertext, @wrappedKeyId, @wrappedKeyVersion, @totalChunks, @createdAt, @updatedAt)
`);

const insertChunkStmt = db.prepare(`
  INSERT INTO file_chunks (id, fileId, chunkIndex, iv, tag, ciphertext, size, createdAt)
  VALUES (@id, @fileId, @chunkIndex, @iv, @tag, @ciphertext, @size, @createdAt)
`);

const listFilesAllStmt = db.prepare(`
  SELECT ${FILE_COLUMNS}
  FROM files
  WHERE userId = ?
  ORDER BY updatedAt DESC
`);

const listFilesByFolderStmt = db.prepare(`
  SELECT ${FILE_COLUMNS}
  FROM files
  WHERE userId = ? AND folderId = ?
  ORDER BY updatedAt DESC
`);

const listFilesInRootStmt = db.prepare(`
  SELECT ${FILE_COLUMNS}
  FROM files
  WHERE userId = ? AND folderId IS NULL
  ORDER BY updatedAt DESC
`);

const getFileStmt = db.prepare(`
  SELECT ${FILE_COLUMNS}
  FROM files
  WHERE id = ? AND userId = ?
`);

const sumAllFilesStmt = db.prepare(`
  SELECT IFNULL(SUM(size), 0) as total
  FROM files
`);

const sumFilesByUserStmt = db.prepare(`
  SELECT IFNULL(SUM(size), 0) as total
  FROM files
  WHERE userId = ?
`);

const deleteFileStmt = db.prepare(`DELETE FROM files WHERE id = ? AND userId = ?`);

const updateFolderStmt = db.prepare(`
  UPDATE files
  SET folderId = @folderId,
      updatedAt = @updatedAt
  WHERE id = @id AND userId = @userId
`);

const getChunksStmt = db.prepare(`
  SELECT id, fileId, chunkIndex, iv, tag, ciphertext, size, createdAt
  FROM file_chunks
  WHERE fileId = ?
  ORDER BY chunkIndex ASC
`);

type PreparedChunk = {
  id: string;
  chunkIndex: number;
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
  size: number;
};

export async function saveEncryptedFile(params: {
  userId: string;
  name: string;
  mimeType: string;
  buffer: Buffer;
  description?: string;
  folderId?: string | null;
}): Promise<FileRecord> {
  const startedAt = Date.now();
  const { userId, name, mimeType, buffer, description, folderId = null } = params;
  if (!buffer.length) {
    throw new Error('Cannot store empty file');
  }

  const chunks = chunkBuffer(buffer, cfg.chunkSize);
  const dataKey = randomBytes(32);
  const kmsKey = await getActiveKmsKey();
  const wrappedKey = await kmsClient.wrapWithKey({ keyId: kmsKey.keyId, version: kmsKey.version, plaintext: dataKey });
  const encryptStart = performance.now();
  const encryptedChunks = await encryptChunksWithDataKey(chunks, dataKey);
  const encryptElapsed = performance.now() - encryptStart;
  dataKey.fill(0);

  const record = await persistEncryptedChunks({
    userId,
    name,
    mimeType,
    size: buffer.length,
    description,
    folderId,
    wrappedKey,
    wrappedKeyId: kmsKey.keyId,
    wrappedKeyVersion: kmsKey.version,
    chunks: encryptedChunks,
  });
  console.info('[upload] file persisted', {
    fileId: record.id,
    size: record.size,
    chunks: encryptedChunks.length,
    encryptMs: Number(encryptElapsed.toFixed(2)),
    totalMs: Date.now() - startedAt,
  });
  recordActivityLog({
    userId,
    action: 'upload',
    targetId: record.id,
    targetName: record.name,
    metadata: { size: record.size, chunks: encryptedChunks.length },
  });
  return record;
}

export function listFiles(userId: string, options: { folderId?: string | null } = {}): FileRecord[] {
  if (options.folderId === undefined) {
    return listFilesAllStmt.all(userId) as FileRecord[];
  }
  if (options.folderId === null) {
    return listFilesInRootStmt.all(userId) as FileRecord[];
  }
  return listFilesByFolderStmt.all(userId, options.folderId) as FileRecord[];
}

export function getFileById(fileId: string, userId: string): FileRecord | undefined {
  return getFileStmt.get(fileId, userId) as FileRecord | undefined;
}

export function getTotalStoredBytes(): number {
  const row = sumAllFilesStmt.get() as { total: number | bigint } | undefined;
  return row && row.total ? Number(row.total) : 0;
}

export function getUserStoredBytes(userId: string): number {
  const row = sumFilesByUserStmt.get(userId) as { total: number | bigint } | undefined;
  return row && row.total ? Number(row.total) : 0;
}

export function deleteFile(fileId: string, userId: string): boolean {
  const res = deleteFileStmt.run(fileId, userId);
  return res.changes > 0;
}

export function getFileChunks(fileId: string): FileChunkRecord[] {
  return getChunksStmt.all(fileId) as FileChunkRecord[];
}

export function moveFileToFolder(params: { fileId: string; userId: string; folderId: string | null }): boolean {
  const { fileId, userId, folderId } = params;
  const now = Date.now();
  const res = updateFolderStmt.run({ id: fileId, userId, folderId, updatedAt: now });
  return res.changes > 0;
}

export type PublicFileRecord = Omit<FileRecord, 'wrappedKeyIv' | 'wrappedKeyTag' | 'wrappedKeyCiphertext' | 'wrappedKeyId' | 'wrappedKeyVersion'>;

export function toPublicFileRecord(file: FileRecord): PublicFileRecord {
  const { wrappedKeyIv, wrappedKeyTag, wrappedKeyCiphertext, wrappedKeyId, wrappedKeyVersion, ...rest } = file;
  return rest;
}

export async function persistEncryptedChunks(params: {
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string | null;
  folderId?: string | null;
  wrappedKey: { iv: Buffer; tag: Buffer; ciphertext: Buffer };
  wrappedKeyId: string;
  wrappedKeyVersion: number;
  chunks: PreparedChunk[];
  fileId?: string;
}): Promise<FileRecord> {
  const fileId = params.fileId ?? nanoid(21);
  const now = Date.now();
  const totalChunks = params.chunks.length;
  const file: FileRecord = {
    id: fileId,
    userId: params.userId,
    name: params.name,
    mimeType: params.mimeType,
    size: params.size,
    description: params.description ?? null,
    folderId: params.folderId ?? null,
    wrappedKeyIv: params.wrappedKey.iv,
    wrappedKeyTag: params.wrappedKey.tag,
    wrappedKeyCiphertext: params.wrappedKey.ciphertext,
    wrappedKeyId: params.wrappedKeyId,
    wrappedKeyVersion: params.wrappedKeyVersion,
    totalChunks,
    createdAt: now,
    updatedAt: now,
  };

  const tx = db.transaction(() => {
    insertFileStmt.run(file);
    params.chunks.forEach((chunk) => {
      insertChunkStmt.run({
        id: chunk.id,
        fileId: file.id,
        chunkIndex: chunk.chunkIndex,
        iv: chunk.iv,
        tag: chunk.tag,
        ciphertext: chunk.ciphertext,
        size: chunk.size,
        createdAt: now,
      });
    });
  });

  tx();
  return file;
}

async function encryptChunksWithDataKey(chunks: Buffer[], key: Buffer): Promise<PreparedChunk[]> {
  const tasks = chunks.map(async (chunk, index) => {
    const encrypted = await encryptionPool.encrypt(chunk, key);
    return {
      id: nanoid(21),
      chunkIndex: index,
      iv: encrypted.iv,
      tag: encrypted.tag,
      ciphertext: encrypted.ciphertext,
      size: chunk.length,
    };
  });
  return Promise.all(tasks);
}
