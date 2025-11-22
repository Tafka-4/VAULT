import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createError, defineEventHandler, readBody } from 'h3';
import { destroySessionsForUser } from '~/server/services/sessionService';
import { getUserByEmail, getUserById, toPublicUser, updateUser } from '~/server/services/userService';
import { establishSession, requireAuth } from '~/server/utils/auth';

const profileSchema = z
  .object({
    email: z.string().email('유효한 이메일을 입력하세요.').optional(),
    password: z.string().min(8, '암호는 8자 이상이어야 합니다.').max(128, '암호가 너무 깁니다.').optional(),
    currentPassword: z.string().min(1, '현재 암호를 입력하세요.').optional(),
  })
  .refine((data) => Boolean(data.email || data.password), {
    message: '변경할 항목을 입력하세요.',
    path: ['email'],
  })
  .refine((data) => {
    if (data.email || data.password) {
      return Boolean(data.currentPassword);
    }
    return true;
  }, {
    message: '현재 암호를 입력하세요.',
    path: ['currentPassword'],
  });

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const body = await readBody(event);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors.map((err) => err.message).join(', '),
    });
  }

  const { email, password, currentPassword } = parsed.data;
  const user = getUserById(auth.user.id);

  if (!user) {
    throw createError({ statusCode: 404, message: '사용자 정보를 찾을 수 없습니다.' });
  }

  if (!currentPassword || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    throw createError({ statusCode: 403, message: '현재 암호가 올바르지 않습니다.' });
  }

  if (email) {
    const lowerEmail = email.toLowerCase();
    const existing = getUserByEmail(lowerEmail);
    if (existing && existing.id !== user.id) {
      throw createError({ statusCode: 409, message: '이미 사용 중인 이메일입니다.' });
    }
  }

  const passwordHash = password ? bcrypt.hashSync(password, 12) : undefined;
  const updatedUser = updateUser(user.id, {
    email: email?.toLowerCase(),
    passwordHash,
  });

  if (!updatedUser) {
    throw createError({ statusCode: 500, message: '계정 정보를 업데이트할 수 없습니다.' });
  }

  destroySessionsForUser(updatedUser.id);
  const publicUser = toPublicUser(updatedUser);
  establishSession(event, publicUser);

  return { data: publicUser };
});
