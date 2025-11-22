import { nanoid } from 'nanoid';
import db from '../utils/db';
import { deleteFilesInFolders } from './fileService';

export type FolderRecord = {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  path: string;
  createdAt: number;
};

const insertFolderStmt = db.prepare(`
  INSERT INTO folders (id, userId, name, parentId, path, createdAt)
  VALUES (@id, @userId, @name, @parentId, @path, @createdAt)
`);

const selectFolderByIdStmt = db.prepare(`
  SELECT id, userId, name, parentId, path, createdAt
  FROM folders
  WHERE id = ?
`);

const listFoldersByUserStmt = db.prepare(`
  SELECT id, userId, name, parentId, path, createdAt
  FROM folders
  WHERE userId = ?
  ORDER BY path COLLATE NOCASE ASC
`);

const listFoldersByParentStmt = db.prepare(`
  SELECT id, userId, name, parentId, path, createdAt
  FROM folders
  WHERE userId = ? AND parentId IS ?
  ORDER BY name COLLATE NOCASE ASC
`);

const deleteFolderStmt = db.prepare('DELETE FROM folders WHERE id = ? AND userId = ?');
const deleteFolderCascadeStmt = db.prepare(
  `DELETE FROM folders WHERE userId = ? AND (id = ? OR path LIKE ? ESCAPE '\\')`
);
const deleteAllFoldersStmt = db.prepare('DELETE FROM folders WHERE userId = ?');
const listDescendantIdsByPathStmt = db.prepare(`
  SELECT id
  FROM folders
  WHERE userId = ? AND path LIKE ? ESCAPE '\\'
`);
const selectDescendantsStmt = db.prepare(`
  SELECT id, path
  FROM folders
  WHERE userId = ? AND path LIKE ? ESCAPE '\\'
`);
const updateFolderMetaStmt = db.prepare(`
  UPDATE folders
  SET parentId = @parentId, path = @path
  WHERE id = @id AND userId = @userId
`);
const findPathConflictStmt = db.prepare(`
  SELECT id FROM folders WHERE userId = ? AND path = ? AND id != ? LIMIT 1
`);

export function createFolder(userId: string, name: string, parentId: string | null = null): FolderRecord {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('폴더 이름을 입력하세요.');
  }
  if (trimmed.includes('/')) {
    throw new Error('폴더 이름에 "/" 문자를 사용할 수 없습니다.');
  }

  let parentPath = '';
  if (parentId) {
    const parent = getFolderById(parentId);
    if (!parent || parent.userId !== userId) {
      throw new Error('상위 폴더를 찾을 수 없습니다.');
    }
    parentPath = parent.path;
  }

  const normalizedParent = parentPath && parentPath !== '/' ? parentPath : '';
  const path = `${normalizedParent}/${trimmed}`.replace(/\/{2,}/g, '/');
  const now = Date.now();
  const record: FolderRecord = {
    id: nanoid(21),
    userId,
    name: trimmed,
    parentId,
    path: path === '' ? '/' : path,
    createdAt: now,
  };

  try {
    insertFolderStmt.run(record);
  } catch (error: any) {
    if (error && typeof error.message === 'string' && error.message.includes('UNIQUE')) {
      throw new Error('같은 경로에 동일한 폴더가 이미 있습니다.');
    }
    throw error;
  }

  return record;
}

export function getFolderById(id: string): FolderRecord | undefined {
  return selectFolderByIdStmt.get(id) as FolderRecord | undefined;
}

export function listFolders(userId: string): FolderRecord[] {
  return listFoldersByUserStmt.all(userId) as FolderRecord[];
}

export function listFoldersByParent(userId: string, parentId: string | null): FolderRecord[] {
  return listFoldersByParentStmt.all(userId, parentId) as FolderRecord[];
}

export function assertFolderOwnership(userId: string, folderId: string): FolderRecord {
  const folder = getFolderById(folderId);
  if (!folder || folder.userId !== userId) {
    throw new Error('폴더를 찾을 수 없습니다.');
  }
  return folder;
}

export function deleteFolder(userId: string, folderId: string): boolean {
  const folder = assertFolderOwnership(userId, folderId);
  if (!folder) {
    throw new Error('폴더를 찾을 수 없습니다.');
  }
  const descendantPattern = `${escapeLike(folder.path)}/%`;
  const descendantRows = listDescendantIdsByPathStmt.all(userId, descendantPattern) as Array<{ id: string }>;
  const descendantIds = descendantRows.map((row) => row.id);
  const targetFolderIds = [folderId, ...descendantIds];
  deleteFilesInFolders(userId, targetFolderIds);
  const res = deleteFolderCascadeStmt.run(userId, folderId, descendantPattern);
  return res.changes > 0;
}

export function deleteAllFoldersForUser(userId: string): number {
  const res = deleteAllFoldersStmt.run(userId);
  return res.changes ?? 0;
}

export function moveFolder(userId: string, folderId: string, targetParentId: string | null): FolderRecord {
  const folder = assertFolderOwnership(userId, folderId);
  if (targetParentId === folderId) {
    throw new Error('폴더를 자기 자신 안으로 이동할 수 없습니다.');
  }

  let parentPath = '';
  if (targetParentId) {
    const parent = assertFolderOwnership(userId, targetParentId);
    if (parent.path.startsWith(folder.path)) {
      throw new Error('하위 폴더로 이동할 수 없습니다.');
    }
    parentPath = parent.path;
  }

  const normalizedParent = parentPath && parentPath !== '/' ? parentPath : '';
  const newPath = `${normalizedParent}/${folder.name}`.replace(/\/{2,}/g, '/');
  if (newPath === folder.path) {
    return folder;
  }

  const conflict = findPathConflictStmt.get(userId, newPath, folderId) as { id: string } | undefined;
  if (conflict) {
    throw new Error('같은 경로에 동일한 폴더가 이미 있습니다.');
  }

  const descendantPattern = `${escapeLike(folder.path)}/%`;
  const descendants = selectDescendantsStmt.all(userId, descendantPattern) as Array<{ id: string; path: string }>;
  const subtreeIds = new Set([folderId, ...descendants.map(d => d.id)]);

  const updates = [{ id: folderId, path: newPath, parentId: targetParentId ?? null }];
  descendants.forEach(desc => {
    updates.push({
      id: desc.id,
      path: desc.path.replace(folder.path, newPath),
      parentId: undefined
    } as any);
  });

  const tx = db.transaction(() => {
    for (const update of updates) {
      updateFolderMetaStmt.run({
        id: update.id,
        userId,
        path: update.path,
        parentId: update.parentId ?? selectFolderByIdStmt.get(update.id)?.parentId ?? null
      });
    }
  });
  tx();

  const updated = getFolderById(folderId);
  if (!updated) {
    throw new Error('폴더를 이동한 후 찾을 수 없습니다.');
  }
  return updated;
}

function escapeLike(value: string) {
  return value.replace(/([%_\\])/g, '\\$1');
}
