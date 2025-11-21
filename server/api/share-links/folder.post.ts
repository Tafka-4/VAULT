import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAuth } from '~/server/utils/auth';
import { getFolderById } from '~/server/services/folderService';
import { createShareLink } from '~/server/services/shareLinkService';
import { listFiles } from '~/server/services/fileService';
import { serializeShareLink } from './utils';

const schema = z.object({
  folderId: z.string().min(1).nullable().optional(),
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
  password: z.string().min(4).max(64).optional(),
});

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const body = await readBody(event);
  const { folderId, expiresInDays, password } = schema.parse(body);

  const targetFolderId = folderId === 'root' ? null : folderId ?? null;
  if (targetFolderId) {
    const folder = getFolderById(targetFolderId);
    if (!folder || folder.userId !== auth.user.id) {
      throw createError({ statusCode: 404, message: '폴더를 찾을 수 없습니다.' });
    }
  }

  const files = listFiles(auth.user.id, { folderId: targetFolderId });
  if (!files.length) {
    throw createError({ statusCode: 400, message: '공유할 파일이 없는 폴더입니다.' });
  }

  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const links = files.map((file) =>
    createShareLink({ userId: auth.user.id, fileId: file.id, expiresAt, password })
  );

  return { data: links.map(serializeShareLink) };
});
