export type ShareLink = {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number | null;
  accessCount: number;
  hasPassword: boolean;
  folderId: string | null;
  folderName: string | null;
  folderPath: string | null;
};

export type PublicShareMetadata = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: number;
  hasPassword: boolean;
  folderPath: string | null;
};
