import { nanoid } from 'nanoid';
import db from '../utils/db';

type InsertParams = {
  userId: string;
  action: string;
  targetId?: string | null;
  targetName?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  targetId: string | null;
  targetName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
};

const insertStmt = db.prepare(`
  INSERT INTO activity_logs (id, userId, action, targetId, targetName, metadata, createdAt)
  VALUES (@id, @userId, @action, @targetId, @targetName, @metadata, @createdAt)
`);

const selectRecentStmt = db.prepare(`
  SELECT id, userId, action, targetId, targetName, metadata, createdAt
  FROM activity_logs
  WHERE userId = ?
  ORDER BY createdAt DESC
  LIMIT ?
`);

export function recordActivityLog(params: InsertParams) {
  const payload = {
    id: nanoid(21),
    userId: params.userId,
    action: params.action,
    targetId: params.targetId ?? null,
    targetName: params.targetName ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    createdAt: Date.now(),
  };
  insertStmt.run(payload);
}

export function listActivityLogs(userId: string, limit = 50): ActivityLog[] {
  return selectRecentStmt
    .all(userId, limit)
    .map((row: any) => ({
      id: row.id,
      userId: row.userId,
      action: row.action,
      targetId: row.targetId ?? null,
      targetName: row.targetName ?? null,
      metadata: row.metadata ? safeParse(row.metadata) : null,
      createdAt: row.createdAt,
    }));
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
