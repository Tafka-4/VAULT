import { createError, defineEventHandler } from 'h3';
import { assertActiveShareLink } from '~/server/services/shareLinkService';
import { getFileById } from '~/server/services/fileService';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '링크 ID가 필요합니다.' });
  }
  const link = assertActiveShareLink(id);
  const file = getFileById(link.fileId, link.userId);
  if (!file) {
    throw createError({ statusCode: 404, message: '파일을 찾을 수 없습니다.' });
  }

  return {
    data: {
      id: link.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimeType,
      expiresAt: link.expiresAt,
      hasPassword: link.hasPassword,
    },
  };
});
