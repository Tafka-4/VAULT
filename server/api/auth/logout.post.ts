import { defineEventHandler } from 'h3';
import { clearSession } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  clearSession(event);
  return { data: { success: true } };
});
