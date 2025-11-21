import { defineEventHandler, createError } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { deleteAllFilesForUser } from '~/server/services/fileService';
import { deleteAllFoldersForUser } from '~/server/services/folderService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  try {
    const removedFiles = deleteAllFilesForUser(auth.user.id);
    const removedFolders = deleteAllFoldersForUser(auth.user.id);
    return { data: { removedFiles, removedFolders } };
  } catch (error) {
    if (error instanceof Error) {
      throw createError({ statusCode: 500, message: error.message });
    }
    throw error;
  }
});
