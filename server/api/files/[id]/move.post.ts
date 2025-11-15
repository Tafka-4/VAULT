import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAuth } from '~/server/utils/auth';
import { assertFolderOwnership } from '~/server/services/folderService';
import { getFileById, moveFileToFolder } from '~/server/services/fileService';

const schema = z.object({
  folderId: z.string().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '파일 ID가 필요합니다.' });
  }
  const file = getFileById(id, auth.user.id);
  if (!file) {
    throw createError({ statusCode: 404, message: '파일을 찾을 수 없습니다.' });
  }
  const body = await readBody(event);
  const { folderId } = schema.parse(body);

  let targetFolderId: string | null = null;
  if (folderId) {
    const folder = assertFolderOwnership(auth.user.id, folderId);
    targetFolderId = folder.id;
  } else if (folderId === null) {
    targetFolderId = null;
  }

  const moved = moveFileToFolder({ fileId: id, userId: auth.user.id, folderId: targetFolderId });
  if (!moved) {
    throw createError({ statusCode: 500, message: '파일을 이동할 수 없습니다.' });
  }
  return { data: { id, folderId: targetFolderId } };
});
