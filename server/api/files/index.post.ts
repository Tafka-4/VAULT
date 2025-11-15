import { createError, defineEventHandler, readMultipartFormData } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { saveEncryptedFile } from '~/server/services/fileService';
import { assertFolderOwnership } from '~/server/services/folderService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const form = await readMultipartFormData(event);
  if (!form?.length) {
    throw createError({ statusCode: 400, message: '업로드할 파일이 없습니다.' });
  }

  const filePart = form.find((part) => Boolean(part.filename));
  if (!filePart) {
    throw createError({ statusCode: 400, message: '파일 필드를 찾을 수 없습니다.' });
  }

  const fileName = filePart.filename || '파일';
  const mimeType = filePart.type || 'application/octet-stream';
  const buffer = filePart.data;

  if (!buffer || !buffer.length) {
    throw createError({ statusCode: 400, message: '빈 파일은 업로드할 수 없습니다.' });
  }

  const descriptionField = form.find((part) => !part.filename && part.name === 'description');
  const description = descriptionField ? descriptionField.data.toString('utf8') : undefined;
  const folderField = form.find((part) => !part.filename && part.name === 'folderId');
  let folderId: string | null | undefined;
  if (folderField) {
    const rawFolder = folderField.data.toString('utf8').trim();
    if (rawFolder === 'root' || rawFolder === '') {
      folderId = null;
    } else {
      const folder = assertFolderOwnership(auth.user.id, rawFolder);
      folderId = folder.id;
    }
  }

  try {
    const record = await saveEncryptedFile({
      userId: auth.user.id,
      name: fileName,
      mimeType,
      buffer,
      description,
      folderId,
    });
    return { data: record };
  } catch (error) {
    const statusCode = typeof (error as any)?.statusCode === 'number' ? (error as any).statusCode : 500;
    const fallbackMessage = '파일을 업로드할 수 없습니다.';
    let message: unknown = error instanceof Error ? error.message : fallbackMessage;
    if (message && typeof message === 'object') {
      message = JSON.stringify(message);
    }
    if (typeof message !== 'string' || !message) {
      message = fallbackMessage;
    }
    throw createError({
      statusCode,
      statusMessage: message,
      message,
      data: { message },
    });
  }
});
