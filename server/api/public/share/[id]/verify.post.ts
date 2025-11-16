import { createError, defineEventHandler, readBody } from 'h3';
import bcrypt from 'bcryptjs';
import { assertActiveShareLink } from '~/server/services/shareLinkService';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '링크 ID가 필요합니다.' });
  }
  const shareLink = assertActiveShareLink(id);
  if (!shareLink.hasPassword) {
    return { data: { verified: true } };
  }
  const body = await readBody<{ password?: string }>(event).catch(() => ({}));
  if (!body?.password || !shareLink.passwordHash) {
    throw createError({ statusCode: 401, message: '비밀번호가 필요합니다.' });
  }
  const ok = bcrypt.compareSync(body.password, shareLink.passwordHash);
  if (!ok) {
    throw createError({ statusCode: 401, message: '비밀번호가 올바르지 않습니다.' });
  }
  return { data: { verified: true } };
});
