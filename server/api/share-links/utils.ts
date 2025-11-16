import type { ShareLink } from '~/types/share';
import type { ShareLinkRecord } from '~/server/services/shareLinkService';

export function serializeShareLink(link: ShareLinkRecord): ShareLink {
  return {
    id: link.id,
    fileId: link.fileId,
    fileName: link.fileName,
    fileSize: link.fileSize,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    lastAccessedAt: link.lastAccessedAt,
    accessCount: link.accessCount,
    hasPassword: link.hasPassword,
  };
}
