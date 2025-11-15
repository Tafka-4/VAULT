import { createError, defineEventHandler, getQuery, readRawBody } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { appendUploadChunk } from '~/server/services/uploadSessionService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, message: '업로드 ID가 필요합니다.' });
  }
  const query = getQuery(event);
  const index = Number(query.index);
  if (!Number.isFinite(index) || index < 0) {
    throw createError({ statusCode: 400, message: '유효하지 않은 청크 인덱스입니다.' });
  }
  const body = await readRawBody(event, false);
  if (!body || !Buffer.isBuffer(body)) {
    throw createError({ statusCode: 400, message: '청크 데이터를 찾을 수 없습니다.' });
  }
  try {
    await appendUploadChunk({
      sessionId: id,
      userId: auth.user.id,
      chunkIndex: index,
      data: body,
    });
    return { data: { index } };
  } catch (error) {
    throw createError({ statusCode: 400, message: error instanceof Error ? error.message : '청크를 저장할 수 없습니다.' });
  }
});
