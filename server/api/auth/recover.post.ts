import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createError, defineEventHandler, readBody } from 'h3';
import { destroySessionsForUser } from '~/server/services/sessionService';
import { findValidResetToken, consumeResetToken } from '~/server/services/passwordResetService';
import { getUserByEmail, getUserById, toPublicUser, updateUser } from '~/server/services/userService';
import { establishSession } from '~/server/utils/auth';
import { isValidVerificationCode } from '~/server/utils/verificationCode';

const recoverySchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(8, '암호는 8자 이상이어야 합니다.').max(128, '암호가 너무 깁니다.'),
  verificationCode: z.string().optional(),
  resetToken: z.string().optional(),
}).refine((value) => Boolean(value.verificationCode || value.resetToken), {
  message: '초대 코드 또는 이메일 링크 토큰이 필요합니다.',
  path: ['verificationCode'],
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = recoverySchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors.map((err) => err.message).join(', '),
    });
  }

  const { email, password, verificationCode: rawVerificationCode, resetToken } = parsed.data;
  const passwordHash = bcrypt.hashSync(password, 12);
  const normalizedEmail = email.toLowerCase();

  if (resetToken) {
    const token = findValidResetToken(resetToken.trim());
    if (!token) {
      throw createError({ statusCode: 403, message: '만료되었거나 잘못된 이메일 링크입니다.' });
    }

    const user = getUserById(token.userId);
    if (!user || user.email !== normalizedEmail) {
      throw createError({ statusCode: 404, message: '해당 이메일의 계정을 찾을 수 없습니다.' });
    }

    const updatedUser = updateUser(user.id, { passwordHash });

    if (!updatedUser) {
      throw createError({ statusCode: 500, message: '암호를 재설정할 수 없습니다.' });
    }

    destroySessionsForUser(updatedUser.id);
    consumeResetToken(token.id);
    const publicUser = toPublicUser(updatedUser);
    establishSession(event, publicUser);

    return { data: publicUser };
  }

  const verificationCode = rawVerificationCode?.trim() ?? '';

  if (!isValidVerificationCode(verificationCode)) {
    throw createError({ statusCode: 403, message: '유효하지 않은 검증 코드입니다.' });
  }

  const existing = getUserByEmail(normalizedEmail);
  if (!existing) {
    throw createError({ statusCode: 404, message: '해당 이메일의 계정을 찾을 수 없습니다.' });
  }

  const updatedUser = updateUser(existing.id, { passwordHash });

  if (!updatedUser) {
    throw createError({ statusCode: 500, message: '암호를 재설정할 수 없습니다.' });
  }

  destroySessionsForUser(updatedUser.id);
  const publicUser = toPublicUser(updatedUser);
  establishSession(event, publicUser);

  return { data: publicUser };
});
