import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { finalizeUploadSession } from '~/server/services/uploadSessionService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '업로드 ID가 필요합니다.' });
  }
  try {
    const record = await finalizeUploadSession(id, auth.user.id);
    return { data: record };
  } catch (error) {
    throw createError({ statusCode: 400, message: error instanceof Error ? error.message : '업로드를 완료할 수 없습니다.' });
  }
});
