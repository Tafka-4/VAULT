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

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    parentId TEXT,
    path TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    UNIQUE(userId, path),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES folders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER NOT NULL,
    description TEXT,
    folderId TEXT,
    wrappedKeyIv BLOB,
    wrappedKeyTag BLOB,
    wrappedKeyCiphertext BLOB,
    wrappedKeyId TEXT,
    wrappedKeyVersion INTEGER,
    totalChunks INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL
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
  CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(userId, parentId);
  CREATE INDEX IF NOT EXISTS idx_chunks_file ON file_chunks(fileId, chunkIndex);
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    action TEXT NOT NULL,
    targetId TEXT,
    targetName TEXT,
    metadata TEXT,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_logs(userId, createdAt DESC);
  CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    fileId TEXT NOT NULL,
    userId TEXT NOT NULL,
    passwordHash TEXT,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    lastAccessedAt INTEGER,
    accessCount INTEGER NOT NULL DEFAULT 0,
    folderId TEXT,
    FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_share_links_user ON share_links(userId, createdAt DESC);
`);

ensureColumn('files', 'folderId', `ALTER TABLE files ADD COLUMN folderId TEXT REFERENCES folders(id) ON DELETE SET NULL`);
db.exec('CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folderId)');
ensureColumn('files', 'wrappedKeyIv', 'ALTER TABLE files ADD COLUMN wrappedKeyIv BLOB');
ensureColumn('files', 'wrappedKeyTag', 'ALTER TABLE files ADD COLUMN wrappedKeyTag BLOB');
ensureColumn('files', 'wrappedKeyCiphertext', 'ALTER TABLE files ADD COLUMN wrappedKeyCiphertext BLOB');
ensureColumn('files', 'wrappedKeyId', 'ALTER TABLE files ADD COLUMN wrappedKeyId TEXT');
ensureColumn('files', 'wrappedKeyVersion', 'ALTER TABLE files ADD COLUMN wrappedKeyVersion INTEGER');
ensureColumn('share_links', 'folderId', 'ALTER TABLE share_links ADD COLUMN folderId TEXT REFERENCES folders(id) ON DELETE CASCADE');

function ensureColumn(table: string, column: string, alterSql: string) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  const hasColumn = info.some((row) => row.name === column);
  if (!hasColumn) {
    try {
      db.exec(alterSql);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`[db] Failed to alter table ${table} to add ${column}`, error);
    }
  }
}

export default db;
