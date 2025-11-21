import { createError, defineEventHandler, getQuery } from 'h3';
import bcrypt from 'bcryptjs';
import { assertActiveShareLink } from '~/server/services/shareLinkService';
import { getFileById, getFileChunks } from '~/server/services/fileService';
import { kmsClient } from '~/server/utils/kmsClient';
import { decryptWithKey } from '~/server/utils/aes';
import { parseZipEntries } from '~/server/utils/zip';
import type { ZipEntriesPayload } from '~/types/files';

const ZIP_MIME_TYPES = new Set(['application/zip', 'application/x-zip-compressed', 'multipart/x-zip']);
const MAX_ENTRIES = 500;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '링크 ID가 필요합니다.' });
  }

  const query = getQuery(event);
  const password = typeof query.password === 'string' ? query.password : undefined;
  const link = assertActiveShareLink(id);

  if (link.hasPassword) {
    if (!password || !link.passwordHash) {
      throw createError({ statusCode: 401, message: '비밀번호가 필요합니다.' });
    }
    const ok = bcrypt.compareSync(password, link.passwordHash);
    if (!ok) {
      throw createError({ statusCode: 401, message: '비밀번호가 올바르지 않습니다.' });
    }
  }

  const file = getFileById(link.fileId, link.userId);
  if (!file) {
    throw createError({ statusCode: 404, message: '파일을 찾을 수 없습니다.' });
  }

  const lowerMime = file.mimeType?.toLowerCase() ?? '';
  const lowerName = file.name.toLowerCase();
  const isZip = ZIP_MIME_TYPES.has(lowerMime) || lowerName.endsWith('.zip');
  if (!isZip) {
    throw createError({ statusCode: 400, message: 'ZIP 파일만 목록을 보여줄 수 있습니다.' });
  }

  const chunks = getFileChunks(file.id);
  if (!chunks.length) {
    throw createError({ statusCode: 500, message: '파일 데이터가 손상되었습니다.' });
  }
  if (!file.wrappedKeyCiphertext || !file.wrappedKeyIv || !file.wrappedKeyTag) {
    throw createError({ statusCode: 500, message: '파일 암호화 정보를 찾을 수 없습니다.' });
  }

  let dataKey: Buffer;
  if (file.wrappedKeyId && typeof file.wrappedKeyVersion === 'number') {
    dataKey = await kmsClient.unwrapWithKey({
      keyId: file.wrappedKeyId,
      version: file.wrappedKeyVersion,
      ciphertext: file.wrappedKeyCiphertext,
      iv: file.wrappedKeyIv,
      tag: file.wrappedKeyTag
    });
  } else {
    dataKey = await kmsClient.decrypt({
      ciphertext: file.wrappedKeyCiphertext,
      iv: file.wrappedKeyIv,
      tag: file.wrappedKeyTag
    });
  }

  const buffers: Buffer[] = [];
  try {
    for (const chunk of chunks) {
      const plaintext = decryptWithKey(chunk.ciphertext, chunk.iv, chunk.tag, dataKey);
      buffers.push(plaintext);
    }
  } finally {
    dataKey.fill(0);
  }

  const full = Buffer.concat(buffers);
  let payload: ZipEntriesPayload;
  try {
    payload = parseZipEntries(full);
  } catch (error) {
    throw createError({ statusCode: 400, message: (error as Error).message || 'ZIP을 해석할 수 없습니다.' });
  }

  let entries = payload.entries;
  let truncated = payload.truncated;
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(0, MAX_ENTRIES);
    truncated = true;
  }

  return {
    data: {
      entries,
      totalEntries: payload.totalEntries,
      truncated
    }
  };
});
