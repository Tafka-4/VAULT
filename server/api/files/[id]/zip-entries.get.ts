import { createError, defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { getFileById, getFileChunks, type FileChunkRecord, type FileRecord } from '~/server/services/fileService';
import { decryptWithKey } from '~/server/utils/aes';
import { kmsClient } from '~/server/utils/kmsClient';
import { parseZipEntries } from '~/server/utils/zip';

const ZIP_MIME_TYPES = new Set(['application/zip', 'application/x-zip-compressed', 'multipart/x-zip']);

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '파일 ID가 필요합니다.' });
  }

  const file = getFileById(id, auth.user.id);
  if (!file) {
    throw createError({ statusCode: 404, message: '파일을 찾을 수 없습니다.' });
  }

  if (!isZipFile(file)) {
    throw createError({ statusCode: 400, message: 'ZIP 파일에서만 내부 목록을 확인할 수 있습니다.' });
  }

  const chunks = getFileChunks(file.id);
  if (!chunks.length) {
    throw createError({ statusCode: 500, message: '파일 데이터가 손상되었습니다.' });
  }

  const dataKey = await unwrapDataKey(file);
  try {
    const buffer = decryptChunksToBuffer(chunks, dataKey, file.size);
    const payload = parseZipEntries(buffer);
    buffer.fill(0);
    return { data: payload };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '압축 파일 구조를 분석할 수 없습니다.',
    });
  } finally {
    dataKey.fill(0);
  }
});

function isZipFile(file: FileRecord) {
  const mime = file.mimeType?.toLowerCase() ?? '';
  const name = file.name.toLowerCase();
  return ZIP_MIME_TYPES.has(mime) || name.endsWith('.zip');
}

async function unwrapDataKey(file: FileRecord) {
  if (!file.wrappedKeyCiphertext || !file.wrappedKeyIv || !file.wrappedKeyTag) {
    throw createError({
      statusCode: 500,
      message: '이 파일 형식은 현재 지원되지 않습니다.',
    });
  }

  if (file.wrappedKeyId && typeof file.wrappedKeyVersion === 'number') {
    return kmsClient.unwrapWithKey({
      keyId: file.wrappedKeyId,
      version: file.wrappedKeyVersion,
      ciphertext: file.wrappedKeyCiphertext,
      iv: file.wrappedKeyIv,
      tag: file.wrappedKeyTag,
    });
  }

  return kmsClient.decrypt({
    ciphertext: file.wrappedKeyCiphertext,
    iv: file.wrappedKeyIv,
    tag: file.wrappedKeyTag,
  });
}

function decryptChunksToBuffer(chunks: FileChunkRecord[], dataKey: Buffer, expectedSize: number) {
  const plaintextChunks = chunks.map((chunk) => decryptWithKey(chunk.ciphertext, chunk.iv, chunk.tag, dataKey));
  const buffer = Buffer.concat(plaintextChunks, expectedSize);
  plaintextChunks.forEach((plain) => plain.fill(0));
  return buffer;
}
