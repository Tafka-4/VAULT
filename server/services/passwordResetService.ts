import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import db from '../utils/db';

const DEFAULT_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type PasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
  consumedAt?: number;
};

const insertResetStmt = db.prepare(`
  INSERT INTO password_reset_tokens (id, userId, tokenHash, expiresAt, createdAt)
  VALUES (@id, @userId, @tokenHash, @expiresAt, @createdAt)
`);

const selectByHashStmt = db.prepare(`
  SELECT id, userId, tokenHash, expiresAt, createdAt, consumedAt
  FROM password_reset_tokens
  WHERE tokenHash = ?
`);

const deleteExpiredStmt = db.prepare(`
  DELETE FROM password_reset_tokens WHERE expiresAt < ?
`);

const deleteByUserStmt = db.prepare(`
  DELETE FROM password_reset_tokens WHERE userId = ?
`);

const consumeStmt = db.prepare(`
  UPDATE password_reset_tokens SET consumedAt = ? WHERE id = ?
`);

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function formatToken(): string {
  const random = randomBytes(48).toString('hex');
  const digest = createHash('sha256').update(random).digest('hex');
  return `VAULT{${digest}}`;
}

export function createPasswordResetToken(userId: string, ttlMs: number = DEFAULT_RESET_TTL_MS) {
  const token = formatToken();
  const tokenHash = hashResetToken(token);
  const now = Date.now();
  const expiresAt = now + ttlMs;

  deleteExpiredStmt.run(now);
  deleteByUserStmt.run(userId);

  const row: PasswordResetToken = {
    id: nanoid(21),
    userId,
    tokenHash,
    expiresAt,
    createdAt: now,
  };

  insertResetStmt.run(row);

  return { token, expiresAt };
}

export function findValidResetToken(token: string): PasswordResetToken | undefined {
  const tokenHash = hashResetToken(token);
  const row = selectByHashStmt.get(tokenHash) as PasswordResetToken | undefined;
  if (!row) return undefined;

  const now = Date.now();
  if (row.expiresAt < now || row.consumedAt) {
    deleteExpiredStmt.run(now);
    return undefined;
  }

  return row;
}

export function consumeResetToken(tokenId: string) {
  consumeStmt.run(Date.now(), tokenId);
}
