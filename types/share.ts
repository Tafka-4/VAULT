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
};

export type PublicShareMetadata = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: number;
  hasPassword: boolean;
};
