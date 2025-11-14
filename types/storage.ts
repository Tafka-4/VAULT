export type StoredFile = {
  id: string;
  userId?: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string | null;
  totalChunks: number;
  createdAt: number;
  updatedAt: number;
};
