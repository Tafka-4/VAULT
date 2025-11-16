import { defineEventHandler } from 'h3';
import { requireAuth } from '~/server/utils/auth';
import { listShareLinks } from '~/server/services/shareLinkService';
import { serializeShareLink } from './utils';

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const links = listShareLinks(auth.user.id).map(serializeShareLink);
  return { data: links };
});
