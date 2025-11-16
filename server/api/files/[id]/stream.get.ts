import { PassThrough } from 'node:stream';
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  sendStream,
  setHeader,
  setResponseStatus,
} from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { getFileById, getFileChunks } from '~/server/services/fileService';
import { recordActivityLog } from '~/server/services/activityLogService';
import { kmsClient } from '~/server/utils/kmsClient';
import { decryptWithKey } from '~/server/utils/aes';

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

  const totalSize = file.size;
  const rangeHeader = getRequestHeader(event, 'range') || undefined;
  const range = parseRange(rangeHeader, totalSize);

  setHeader(event, 'Content-Type', file.mimeType || 'application/octet-stream');
  setHeader(event, 'Accept-Ranges', 'bytes');
  setHeader(event, 'Content-Length', String(range.end - range.start + 1));
  const query = getQuery(event);
  const dispositionType = 'download' in query ? 'attachment' : 'inline';
  setHeader(event, 'Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(file.name)}"`);
  setHeader(event, 'Cache-Control', 'private, no-store');

  if (range.partial) {
    setResponseStatus(event, 206);
    setHeader(event, 'Content-Range', `bytes ${range.start}-${range.end}/${totalSize}`);
  } else {
    setResponseStatus(event, 200);
  }

  const chunks = getFileChunks(file.id);
  if (!chunks.length) {
    throw createError({ statusCode: 500, message: '파일 데이터가 손상되었습니다.' });
  }

  if (!file.wrappedKeyCiphertext || !file.wrappedKeyIv || !file.wrappedKeyTag) {
    throw createError({
      statusCode: 500,
      message: 'Legacy 파일 형식은 더 이상 지원되지 않습니다. 파일을 다시 업로드해주세요.',
    });
  }

  const dataKey = await kmsClient.decrypt({
    ciphertext: file.wrappedKeyCiphertext,
    iv: file.wrappedKeyIv,
    tag: file.wrappedKeyTag,
  });

  const stream = new PassThrough();
  recordActivityLog({
    userId: auth.user.id,
    action: 'download',
    targetId: file.id,
    targetName: file.name,
    metadata: { bytes: range.end - range.start + 1, range: range.partial },
  });
  const streamKey = dataKey;
  (async () => {
    try {
      await pipeChunks(stream, chunks, range.start, range.end, streamKey);
      stream.end();
    } catch (error) {
      stream.destroy(error as Error);
    } finally {
      streamKey?.fill(0);
    }
  })();

  return sendStream(event, stream);
});

type RangeInfo = { start: number; end: number; partial: boolean };

function parseRange(input: string | undefined, totalSize: number): RangeInfo {
  if (!input || !input.startsWith('bytes=')) {
    return { start: 0, end: Math.max(totalSize - 1, 0), partial: false };
  }

  const [startPart, endPart] = input.slice(6).split('-', 2);
  let start = Number(startPart);
  let end = Number(endPart);

  if (Number.isNaN(start)) {
    const suffixLength = Number(endPart);
    if (Number.isNaN(suffixLength)) {
      throw createError({ statusCode: 416, message: '잘못된 Range 헤더입니다.' });
    }
    start = Math.max(totalSize - suffixLength, 0);
    end = totalSize - 1;
  } else if (Number.isNaN(end)) {
    end = totalSize - 1;
  }

  start = Math.max(0, start);
  end = Math.min(totalSize - 1, end);

  if (start >= totalSize) {
    const fallbackStart = totalSize > 0 ? totalSize - 1 : 0;
    return { start: fallbackStart, end: fallbackStart, partial: true };
  }

  if (start > end) {
    return { start: 0, end: Math.max(totalSize - 1, 0), partial: false };
  }

  return { start, end, partial: start !== 0 || end !== totalSize - 1 };
}

async function pipeChunks(
  stream: PassThrough,
  chunks: ReturnType<typeof getFileChunks>,
  start: number,
  end: number,
  dataKey: Buffer
) {
  let offset = 0;

  for (const chunk of chunks) {
    const chunkStart = offset;
    const chunkEnd = offset + chunk.size - 1;
    offset += chunk.size;

    if (chunkEnd < start) {
      continue;
    }
    if (chunkStart > end) {
      break;
    }

    const plaintext = decryptWithKey(chunk.ciphertext, chunk.iv, chunk.tag, dataKey);

    const relativeStart = Math.max(0, start - chunkStart);
    const relativeEndExclusive = Math.min(chunk.size, end - chunkStart + 1);
    const slice = plaintext.subarray(relativeStart, relativeEndExclusive);

    if (slice.length) {
      if (!stream.write(slice)) {
        await new Promise((resolve) => stream.once('drain', resolve));
      }
    }
  }
}
