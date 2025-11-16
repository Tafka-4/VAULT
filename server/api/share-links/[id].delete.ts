import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { deleteShareLink } from '~/server/services/shareLinkService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '공유 링크 ID가 필요합니다.' });
  }
  const removed = deleteShareLink(id, auth.user.id);
  if (!removed) {
    throw createError({ statusCode: 404, message: '공유 링크를 찾을 수 없습니다.' });
  }
  return { data: { success: true } };
});
