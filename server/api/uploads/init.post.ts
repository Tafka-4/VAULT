import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAuth } from '~/server/utils/auth';
import { assertFolderOwnership } from '~/server/services/folderService';
import { createUploadSession } from '~/server/services/uploadSessionService';

const schema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  totalChunks: z.number().int().positive(),
  folderId: z.string().optional().nullable(),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors.map((err) => err.message).join(', ') });
  }
  const { name, mimeType, size, totalChunks, folderId, description } = parsed.data;
  let targetFolderId: string | null = null;
  if (folderId) {
    const folder = assertFolderOwnership(auth.user.id, folderId);
    targetFolderId = folder.id;
  }
  const session = await createUploadSession({
    userId: auth.user.id,
    name,
    mimeType,
    size,
    totalChunks,
    folderId: targetFolderId,
    description,
  });
  return { data: { uploadId: session.id } };
});
