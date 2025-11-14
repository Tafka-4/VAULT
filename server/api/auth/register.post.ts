import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createError, defineEventHandler, readBody } from 'h3';
import { createUser, getUserByEmail, toPublicUser } from '~/server/services/userService';
import { establishSession } from '~/server/utils/auth';
import { isValidVerificationCode } from '~/server/utils/verificationCode';

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(8, '암호는 8자 이상이어야 합니다.').max(128, '암호가 너무 깁니다.'),
  verificationCode: z.string().min(8, '검증 코드를 입력하세요.'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors.map((err) => err.message).join(', '),
    });
  }

  const {
    email,
    password,
    verificationCode: rawVerificationCode,
  } = parsed.data;
  const existing = getUserByEmail(email);
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: '이미 가입된 이메일입니다.',
    });
  }

  const verificationCode = rawVerificationCode.trim();

  if (!verificationCode || !isValidVerificationCode(verificationCode)) {
    throw createError({
      statusCode: 403,
      statusMessage: '유효하지 않은 검증 코드입니다.',
    });
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const user = createUser(email, passwordHash);
  const publicUser = toPublicUser(user);
  establishSession(event, publicUser);
  return { data: publicUser };
});
