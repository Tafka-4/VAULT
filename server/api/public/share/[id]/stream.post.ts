import { PassThrough } from 'node:stream';
import { createError, defineEventHandler, readBody, setHeader, sendStream } from 'h3';
import bcrypt from 'bcryptjs';
import { assertActiveShareLink, recordShareAccess } from '~/server/services/shareLinkService';
import { getFileById, getFileChunks } from '~/server/services/fileService';
import { kmsClient } from '~/server/utils/kmsClient';
import { decryptWithKey } from '~/server/utils/aes';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '링크 ID가 필요합니다.' });
  }

  const shareLink = assertActiveShareLink(id);
  const body = await readBody<{ password?: string }>(event).catch(() => ({}));
  if (shareLink.hasPassword) {
    if (!body?.password || !shareLink.passwordHash) {
      throw createError({ statusCode: 401, message: '비밀번호가 필요합니다.' });
    }
    const ok = bcrypt.compareSync(body.password, shareLink.passwordHash);
    if (!ok) {
      throw createError({ statusCode: 401, message: '비밀번호가 올바르지 않습니다.' });
    }
  }

  const file = getFileById(shareLink.fileId, shareLink.userId);
  if (!file) {
    throw createError({ statusCode: 404, message: '파일을 찾을 수 없습니다.' });
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
      tag: file.wrappedKeyTag,
    });
  } else {
    dataKey = await kmsClient.decrypt({
      ciphertext: file.wrappedKeyCiphertext,
      iv: file.wrappedKeyIv,
      tag: file.wrappedKeyTag,
    });
  }

  setHeader(event, 'Content-Type', file.mimeType || 'application/octet-stream');
  setHeader(event, 'Content-Length', String(file.size));
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  setHeader(event, 'Cache-Control', 'no-store');

  const stream = new PassThrough();
  (async () => {
    try {
      for (const chunk of chunks) {
        const plaintext = decryptWithKey(chunk.ciphertext, chunk.iv, chunk.tag, dataKey);
        if (!stream.write(plaintext)) {
          await new Promise((resolve) => stream.once('drain', resolve));
        }
      }
      stream.end();
      recordShareAccess(id);
    } catch (error) {
      stream.destroy(error as Error);
    } finally {
      dataKey.fill(0);
    }
  })();

  return sendStream(event, stream);
});
