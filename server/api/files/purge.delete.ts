import { defineEventHandler, createError } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { deleteAllFilesForUser } from '~/server/services/fileService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  try {
    const removed = deleteAllFilesForUser(auth.user.id);
    return { data: { removed } };
  } catch (error) {
    if (error instanceof Error) {
      throw createError({ statusCode: 500, message: error.message });
    }
    throw error;
  }
});
