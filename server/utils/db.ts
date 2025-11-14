import fs from 'node:fs';
import { dirname } from 'pathe';
import Database from 'better-sqlite3';
import { getAppConfig } from './config';

const cfg = getAppConfig();

fs.mkdirSync(dirname(cfg.dbPath), { recursive: true });

const db = new Database(cfg.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    tokenHash TEXT NOT NULL UNIQUE,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER NOT NULL,
    description TEXT,
    totalChunks INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS file_chunks (
    id TEXT PRIMARY KEY,
    fileId TEXT NOT NULL,
    chunkIndex INTEGER NOT NULL,
    iv BLOB NOT NULL,
    tag BLOB NOT NULL,
    ciphertext BLOB NOT NULL,
    size INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    UNIQUE(fileId, chunkIndex),
    FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(tokenHash);
  CREATE INDEX IF NOT EXISTS idx_files_user ON files(userId, createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_chunks_file ON file_chunks(fileId, chunkIndex);
`);

export default db;
