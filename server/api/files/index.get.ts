import { defineEventHandler, getQuery } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { listFiles } from '~/server/services/fileService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const query = getQuery(event);
  const folderParam = typeof query.folderId === 'string' ? query.folderId : undefined;
  let folderId: string | null | undefined;
  if (folderParam === 'root') {
    folderId = null;
  } else if (folderParam) {
    folderId = folderParam;
  }
  const files = listFiles(auth.user.id, { folderId });
  return { data: files };
});
