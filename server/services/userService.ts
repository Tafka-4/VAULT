import { nanoid } from 'nanoid';
import db from '../utils/db';

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
};

export type PublicUser = {
  id: string;
  email: string;
  createdAt: number;
};

const insertUserStmt = db.prepare(`
  INSERT INTO users (id, email, passwordHash, createdAt)
  VALUES (@id, @email, @passwordHash, @createdAt)
`);

const selectByEmailStmt = db.prepare(`
  SELECT id, email, passwordHash, createdAt FROM users WHERE email = ?
`);

const selectByIdStmt = db.prepare(`
  SELECT id, email, passwordHash, createdAt FROM users WHERE id = ?
`);

const updateUserStmt = db.prepare(`
  UPDATE users
  SET email = COALESCE(@email, email), passwordHash = COALESCE(@passwordHash, passwordHash)
  WHERE id = @id
`);

export function createUser(email: string, passwordHash: string): DbUser {
  const now = Date.now();
  const user: DbUser = { id: nanoid(21), email: email.toLowerCase(), passwordHash, createdAt: now };
  insertUserStmt.run(user);
  return user;
}

export function getUserByEmail(email: string): DbUser | undefined {
  return selectByEmailStmt.get(email.toLowerCase());
}

export function getUserById(id: string): DbUser | undefined {
  return selectByIdStmt.get(id);
}

export function updateUser(id: string, fields: Partial<Pick<DbUser, 'email' | 'passwordHash'>>): DbUser | undefined {
  const current = getUserById(id);
  if (!current) return undefined;

  const updated: DbUser = {
    ...current,
    ...fields,
    email: fields.email ? fields.email.toLowerCase() : current.email,
  };

  updateUserStmt.run({
    id,
    email: updated.email,
    passwordHash: updated.passwordHash,
  });

  return updated;
}

export function toPublicUser(user: DbUser): PublicUser {
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}
