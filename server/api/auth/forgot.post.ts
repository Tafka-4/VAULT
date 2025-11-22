import { z } from 'zod';
import { defineEventHandler, getRequestURL, readBody } from 'h3';
import { getUserByEmail } from '~/server/services/userService';
import { createPasswordResetToken } from '~/server/services/passwordResetService';
import { sendMail } from '~/server/utils/mailer';

const forgotSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return { data: { sent: true } }; // Avoid user enumeration while keeping UX simple
  }

  const { email } = parsed.data;
  const user = getUserByEmail(email);

  if (user) {
    const { token, expiresAt } = createPasswordResetToken(user.id);
    const url = getRequestURL(event);
    const base = `${url.protocol}//${url.host}`;
    const resetLink = `${base}/password-recovery?token=${token}`;

    try {
      await sendMail({
        to: user.email,
        subject: '[VAULT] 암호 재설정 링크',
        text: `암호 재설정을 요청하셨다면 아래 링크를 클릭하거나 토큰을 복사해 사용하세요.\n\n링크: ${resetLink}\n토큰: ${token}\n유효시간: ${new Date(expiresAt).toLocaleString()}\n\n요청하지 않았다면 이 메일을 무시해 주세요.`,
        html: `<p>암호 재설정을 요청하셨다면 아래 링크를 눌러주세요.</p><p><a href="${resetLink}">${resetLink}</a></p><p>또는 토큰을 복사해 사용하세요:</p><pre>${token}</pre><p>유효시간: ${new Date(expiresAt).toLocaleString()}</p><p>본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>`,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[auth] Failed to send reset email', error);
    }

    // eslint-disable-next-line no-console
    console.info('[auth] Password reset link generated', { email: user.email, resetLink, expiresAt });
  }

  return { data: { sent: true } };
});
