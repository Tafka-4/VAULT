import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAuth } from '~/server/utils/auth';
import { moveFolder } from '~/server/services/folderService';
import { recordActivityLog } from '~/server/services/activityLogService';

const schema = z.object({
  parentId: z.string().nullable().optional()
});

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '폴더 ID가 필요합니다.' });
  }

  const body = await readBody(event);
  const { parentId } = schema.parse(body);

  try {
    const updated = moveFolder(auth.user.id, id, parentId ?? null);
    recordActivityLog({
      userId: auth.user.id,
      action: 'move',
      targetId: id,
      targetName: updated.name,
      metadata: { to: updated.parentId ?? 'root' }
    });
    return { data: updated };
  } catch (error) {
    if (error instanceof Error) {
      throw createError({ statusCode: 400, message: error.message });
    }
    throw error;
  }
});
