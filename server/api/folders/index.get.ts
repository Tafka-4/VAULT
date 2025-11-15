import { defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { listFolders } from '~/server/services/folderService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const folders = listFolders(auth.user.id);
  return { data: folders };
});
