import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { deleteFile, getFileById } from '~/server/services/fileService';
import { recordActivityLog } from '~/server/services/activityLogService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '파일 ID가 필요합니다.' });
  }

  const file = getFileById(id, auth.user.id);
  if (!file) {
    throw createError({ statusCode: 404, message: '삭제할 파일을 찾을 수 없습니다.' });
  }
  const removed = deleteFile(id, auth.user.id);
  if (!removed) {
    throw createError({ statusCode: 500, message: '파일을 삭제할 수 없습니다.' });
  }

  recordActivityLog({
    userId: auth.user.id,
    action: 'delete',
    targetId: file.id,
    targetName: file.name,
    metadata: { size: file.size },
  });

  return { data: { success: true } };
});
