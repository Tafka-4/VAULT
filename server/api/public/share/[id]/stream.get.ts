import { defineEventHandler } from 'h3';
import { handleShareStream } from '~/server/api/public/share/streamHandler';

export default defineEventHandler(async (event) => {
  return handleShareStream(event, { source: 'query' });
});
