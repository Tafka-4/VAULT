import { defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  return { data: auth.user };
});
