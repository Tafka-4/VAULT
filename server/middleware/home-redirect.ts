import { defineEventHandler, sendRedirect } from 'h3';
import { getAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
  if (event.path !== '/' && event.path !== '') {
    return;
  }

  const auth = await getAuth(event);
  if (auth) {
    return sendRedirect(event, '/app', 302);
  }
});
