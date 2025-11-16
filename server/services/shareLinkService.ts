import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../utils/db';

type ShareLinkRow = {
  id: string;
  fileId: string;
  userId: string;
  passwordHash: string | null;
  expiresAt: number;
  createdAt: number;
  lastAccessedAt: number | null;
  accessCount: number;
  fileName?: string;
  fileSize?: number;
};

export type ShareLinkRecord = {
  id: string;
  fileId: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  lastAccessedAt: number | null;
  accessCount: number;
  hasPassword: boolean;
  passwordHash: string | null;
  fileName: string;
  fileSize: number;
};

const insertStmt = db.prepare(`
  INSERT INTO share_links (id, fileId, userId, passwordHash, expiresAt, createdAt, lastAccessedAt, accessCount)
  VALUES (@id, @fileId, @userId, @passwordHash, @expiresAt, @createdAt, NULL, 0)
`);

const listStmt = db.prepare(`
  SELECT sl.*, f.name as fileName, f.size as fileSize
  FROM share_links sl
  JOIN files f ON f.id = sl.fileId
  WHERE sl.userId = ?
  ORDER BY sl.createdAt DESC
`);

const deleteStmt = db.prepare(`DELETE FROM share_links WHERE id = ? AND userId = ?`);

const getStmt = db.prepare(`
  SELECT sl.*, f.name as fileName, f.size as fileSize
  FROM share_links sl
  JOIN files f ON f.id = sl.fileId
  WHERE sl.id = ?
`);

const touchStmt = db.prepare(`
  UPDATE share_links
  SET lastAccessedAt = @timestamp, accessCount = accessCount + 1
  WHERE id = @id
`);

export function createShareLink(params: { userId: string; fileId: string; expiresAt: number; password?: string | null }) {
  const payload = {
    id: nanoid(15),
    fileId: params.fileId,
    userId: params.userId,
    passwordHash: params.password ? bcrypt.hashSync(params.password, 10) : null,
    expiresAt: params.expiresAt,
    createdAt: Date.now(),
  };
  insertStmt.run(payload);
  const row = getShareLinkById(payload.id);
  if (!row) {
    throw new Error('Failed to create share link');
  }
  return row;
}

export function listShareLinks(userId: string): ShareLinkRecord[] {
  const rows = listStmt.all(userId) as ShareLinkRow[];
  return rows.map(toRecord);
}

export function deleteShareLink(id: string, userId: string): boolean {
  const res = deleteStmt.run(id, userId);
  return res.changes > 0;
}

export function getShareLinkById(id: string): ShareLinkRecord | undefined {
  const row = getStmt.get(id) as ShareLinkRow | undefined;
  if (!row) return undefined;
  return toRecord(row);
}

export function assertActiveShareLink(id: string): ShareLinkRecord {
  const link = getShareLinkById(id);
  if (!link) {
    throw new Error('공유 링크를 찾을 수 없습니다.');
  }
  if (link.expiresAt < Date.now()) {
    throw new Error('공유 링크가 만료되었습니다.');
  }
  return link;
}

export function recordShareAccess(id: string) {
  touchStmt.run({ id, timestamp: Date.now() });
}

function toRecord(row: ShareLinkRow): ShareLinkRecord {
  return {
    id: row.id,
    fileId: row.fileId,
    userId: row.userId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    lastAccessedAt: row.lastAccessedAt ?? null,
    accessCount: row.accessCount ?? 0,
    hasPassword: Boolean(row.passwordHash),
    passwordHash: row.passwordHash ?? null,
    fileName: row.fileName ?? '',
    fileSize: row.fileSize ?? 0,
  };
}
