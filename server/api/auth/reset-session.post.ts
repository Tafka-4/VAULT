import { z } from 'zod';
import { createError, defineEventHandler, readBody } from 'h3';
import { establishSession } from '~/server/utils/auth';
import { findValidResetToken } from '~/server/services/passwordResetService';
import { getUserById, toPublicUser } from '~/server/services/userService';

const schema = z.object({ token: z.string().min(10, '토큰이 필요합니다.') });

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors.map((err) => err.message).join(', ') });
  }

  const token = parsed.data.token.trim();
  const reset = findValidResetToken(token);
  if (!reset) {
    throw createError({ statusCode: 403, message: '만료되었거나 잘못된 링크입니다.' });
  }

  const user = getUserById(reset.userId);
  if (!user) {
    throw createError({ statusCode: 404, message: '계정을 찾을 수 없습니다.' });
  }

  const publicUser = toPublicUser(user);
  establishSession(event, publicUser);

  return { data: publicUser };
});
