import { defineEventHandler, getQuery } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { listActivityLogs } from '~/server/services/activityLogService';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const query = getQuery(event);
  const limit = Math.max(1, Math.min(Number(query.limit) || 50, 200));
  const logs = listActivityLogs(auth.user.id, limit);
  return {
    data: logs,
  };
});
