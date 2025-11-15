import { nanoid } from 'nanoid';
import db from '../utils/db';
import { getAppConfig } from '../utils/config';
import { chunkBuffer } from '../utils/chunk';
import { kmsClient } from '../utils/kmsClient';

const cfg = getAppConfig();

export type FileRecord = {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string | null;
  folderId?: string | null;
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

const insertFileStmt = db.prepare(`
  INSERT INTO files (id, userId, name, mimeType, size, description, folderId, totalChunks, createdAt, updatedAt)
  VALUES (@id, @userId, @name, @mimeType, @size, @description, @folderId, @totalChunks, @createdAt, @updatedAt)
`);

const insertChunkStmt = db.prepare(`
  INSERT INTO file_chunks (id, fileId, chunkIndex, iv, tag, ciphertext, size, createdAt)
  VALUES (@id, @fileId, @chunkIndex, @iv, @tag, @ciphertext, @size, @createdAt)
`);

const listFilesAllStmt = db.prepare(`
  SELECT id, userId, name, mimeType, size, description, folderId, totalChunks, createdAt, updatedAt
  FROM files
  WHERE userId = ?
  ORDER BY updatedAt DESC
`);

const listFilesByFolderStmt = db.prepare(`
  SELECT id, userId, name, mimeType, size, description, folderId, totalChunks, createdAt, updatedAt
  FROM files
  WHERE userId = ? AND folderId = ?
  ORDER BY updatedAt DESC
`);

const listFilesInRootStmt = db.prepare(`
  SELECT id, userId, name, mimeType, size, description, folderId, totalChunks, createdAt, updatedAt
  FROM files
  WHERE userId = ? AND folderId IS NULL
  ORDER BY updatedAt DESC
`);

const getFileStmt = db.prepare(`
  SELECT id, userId, name, mimeType, size, description, folderId, totalChunks, createdAt, updatedAt
  FROM files
  WHERE id = ? AND userId = ?
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
  const { userId, name, mimeType, buffer, description, folderId = null } = params;
  if (!buffer.length) {
    throw new Error('Cannot store empty file');
  }

  const chunks = chunkBuffer(buffer, cfg.chunkSize);
  const fileId = nanoid(21);
  const encryptedChunks = await encryptChunksConcurrently(chunks, cfg.encryptConcurrency);

  const now = Date.now();
  const file: FileRecord = {
    id: fileId,
    userId,
    name,
    mimeType,
    size: buffer.length,
    description,
    folderId,
    totalChunks: encryptedChunks.length,
    createdAt: now,
    updatedAt: now,
  };

  const tx = db.transaction(() => {
    insertFileStmt.run(file);
    encryptedChunks.forEach((chunk: PreparedChunk) => {
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

async function encryptChunksConcurrently(chunks: Buffer[], concurrency: number): Promise<PreparedChunk[]> {
  const total = chunks.length;
  if (!total) return [];
  const workerCount = Math.max(1, Math.min(concurrency, total));
  const results = new Array<PreparedChunk>(total);
  let nextIndex = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const current = nextIndex++;
      if (current >= total) break;
      const chunk = chunks[current];
      const encrypted = await kmsClient.encrypt(chunk);
      results[current] = {
        id: nanoid(21),
        chunkIndex: current,
        iv: encrypted.iv,
        tag: encrypted.tag,
        ciphertext: encrypted.ciphertext,
        size: chunk.length,
      };
    }
  });

  await Promise.all(workers);
  return results;
}
