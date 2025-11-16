import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAuth } from '~/server/utils/auth';
import { getFileById } from '~/server/services/fileService';
import { createShareLink } from '~/server/services/shareLinkService';
import { serializeShareLink } from './utils';

const schema = z.object({
  fileId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
  password: z.string().min(4).max(64).optional(),
});

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const body = await readBody(event);
  const { fileId, expiresInDays, password } = schema.parse(body);

  const file = getFileById(fileId, auth.user.id);
  if (!file) {
    throw createError({ statusCode: 404, message: '파일을 찾을 수 없습니다.' });
  }

  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const link = createShareLink({ userId: auth.user.id, fileId, expiresAt, password });

  return { data: serializeShareLink(link) };
});
