import { defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { isValidVerificationCode } from '~/server/utils/verificationCode';

const verificationSchema = z.object({
  verificationCode: z.string().min(1, '검증 코드가 필요합니다.'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = verificationSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message || '검증 코드가 필요합니다.';
    return { data: { valid: false, message } };
  }

  const verificationCode = parsed.data.verificationCode.trim();
  const valid = isValidVerificationCode(verificationCode);

  return {
    data: {
      valid,
      message: valid ? null : '유효하지 않은 초대 코드입니다.',
    },
  };
});
