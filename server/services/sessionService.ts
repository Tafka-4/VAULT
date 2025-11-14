import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import db from '../utils/db';
import { getAppConfig } from '../utils/config';
import type { DbUser, PublicUser } from './userService';

const cfg = getAppConfig();

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
};

type SessionWithUser = SessionRecord & { user: PublicUser };

const insertSessionStmt = db.prepare(`
  INSERT INTO sessions (id, userId, tokenHash, expiresAt, createdAt)
  VALUES (@id, @userId, @tokenHash, @expiresAt, @createdAt)
`);

const selectSessionStmt = db.prepare(`
  SELECT sessions.id,
         sessions.userId,
         sessions.tokenHash,
         sessions.expiresAt,
         sessions.createdAt,
         users.email,
         users.createdAt as userCreatedAt
  FROM sessions
  JOIN users ON users.id = sessions.userId
  WHERE sessions.tokenHash = ?
`);

const deleteSessionStmt = db.prepare(`
  DELETE FROM sessions WHERE tokenHash = ?
`);

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(userId: string) {
  const token = nanoid(48);
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const session: SessionRecord = {
    id: nanoid(21),
    userId,
    tokenHash,
    createdAt: now,
    expiresAt: now + cfg.sessionTtlMs,
  };
  insertSessionStmt.run(session);
  return { token, expiresAt: session.expiresAt };
}

export function destroySessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);
  deleteSessionStmt.run(tokenHash);
}

export function getSessionByToken(token: string): SessionWithUser | undefined {
  const tokenHash = hashSessionToken(token);
  const row = selectSessionStmt.get(tokenHash) as (SessionRecord & {
    email: string;
    userCreatedAt: number;
  }) | undefined;
  if (!row) return undefined;

  if (row.expiresAt < Date.now()) {
    deleteSessionStmt.run(tokenHash);
    return undefined;
  }

  const user: PublicUser = {
    id: row.userId,
    email: row.email,
    createdAt: row.userCreatedAt,
  };

  const session: SessionWithUser = {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    user,
  };

  return session;
}
