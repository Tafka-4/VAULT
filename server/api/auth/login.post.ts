import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createError, defineEventHandler, readBody } from 'h3';
import { getUserByEmail, toPublicUser } from '~/server/services/userService';
import { establishSession } from '~/server/utils/auth';

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(1, '암호를 입력하세요.'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((err) => err.message).join(', '),
    });
  }

  const { email, password } = parsed.data;
  const user = getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: '이메일 혹은 암호가 올바르지 않습니다.' });
  }

  const publicUser = toPublicUser(user);
  establishSession(event, publicUser);
  return { data: publicUser };
});
