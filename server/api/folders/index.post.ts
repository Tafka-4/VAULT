import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAuth } from '~/server/utils/auth';
import { createFolder } from '~/server/services/folderService';

const schema = z.object({
  name: z.string().min(1, '폴더 이름을 입력하세요.').max(80, '폴더 이름이 너무 깁니다.'),
  parentId: z.string().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const body = await readBody(event);
  const { name, parentId } = schema.parse(body);
  try {
    const folder = createFolder(auth.user.id, name, parentId ?? null);
    return { data: folder };
  } catch (error) {
    throw createError({ statusCode: 400, message: error instanceof Error ? error.message : '폴더를 생성할 수 없습니다.' });
  }
});
