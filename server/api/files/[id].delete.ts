import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { deleteFile } from '~/server/services/fileService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '파일 ID가 필요합니다.' });
  }

  const removed = deleteFile(id, auth.user.id);
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: '삭제할 파일을 찾을 수 없습니다.' });
  }

  return { data: { success: true } };
});
