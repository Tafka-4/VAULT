import { defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { listFiles } from '~/server/services/fileService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const files = listFiles(auth.user.id);
  return { data: files };
});
