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
  INSERT INTO files (id, userId, name, mimeType, size, description, totalChunks, createdAt, updatedAt)
  VALUES (@id, @userId, @name, @mimeType, @size, @description, @totalChunks, @createdAt, @updatedAt)
`);

const insertChunkStmt = db.prepare(`
  INSERT INTO file_chunks (id, fileId, chunkIndex, iv, tag, ciphertext, size, createdAt)
  VALUES (@id, @fileId, @chunkIndex, @iv, @tag, @ciphertext, @size, @createdAt)
`);

const listFilesStmt = db.prepare(`
  SELECT id, userId, name, mimeType, size, description, totalChunks, createdAt, updatedAt
  FROM files
  WHERE userId = ?
  ORDER BY updatedAt DESC
`);

const getFileStmt = db.prepare(`
  SELECT id, userId, name, mimeType, size, description, totalChunks, createdAt, updatedAt
  FROM files
  WHERE id = ? AND userId = ?
`);

const deleteFileStmt = db.prepare(`DELETE FROM files WHERE id = ? AND userId = ?`);

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
}): Promise<FileRecord> {
  const { userId, name, mimeType, buffer, description } = params;
  if (!buffer.length) {
    throw new Error('Cannot store empty file');
  }

  const chunks = chunkBuffer(buffer, cfg.chunkSize);
  const fileId = nanoid(21);
  const encryptedChunks: PreparedChunk[] = [];

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const encrypted = await kmsClient.encrypt(chunk);
    encryptedChunks.push({
      id: nanoid(21),
      chunkIndex: index,
      iv: encrypted.iv,
      tag: encrypted.tag,
      ciphertext: encrypted.ciphertext,
      size: chunk.length,
    });
  }

  const now = Date.now();
  const file: FileRecord = {
    id: fileId,
    userId,
    name,
    mimeType,
    size: buffer.length,
    description,
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

export function listFiles(userId: string): FileRecord[] {
  return listFilesStmt.all(userId) as FileRecord[];
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
