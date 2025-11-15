import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { deleteFolder } from '~/server/services/folderService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '폴더 ID가 필요합니다.' });
  }
  try {
    const removed = deleteFolder(auth.user.id, id);
    if (!removed) {
      throw createError({ statusCode: 404, message: '폴더를 찾을 수 없습니다.' });
    }
    return { data: { success: true } };
  } catch (error) {
    if (error instanceof Error) {
      throw createError({ statusCode: 400, message: error.message });
    }
    throw error;
  }
});
