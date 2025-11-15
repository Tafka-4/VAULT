export type StoredFile = {
  id: string;
  userId?: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string | null;
  folderId?: string | null;
  totalChunks: number;
  createdAt: number;
  updatedAt: number;
};

export type StoredFolder = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  createdAt: number;
};
