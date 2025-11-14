import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { getFileById } from '~/server/services/fileService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '파일 ID가 필요합니다.' });
  }
  const file = getFileById(id, auth.user.id);
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: '파일을 찾을 수 없습니다.' });
  }
  return { data: file };
});
