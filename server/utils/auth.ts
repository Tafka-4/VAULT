import { createError, deleteCookie, getCookie, setCookie } from 'h3';
import type { H3Event } from 'h3';
import { getSessionByToken, createSession, destroySessionByToken } from '../services/sessionService';
import type { PublicUser } from '../services/userService';

const SESSION_COOKIE = 'vault_session';

export type AuthContext = {
  user: PublicUser;
  token: string;
};

export async function getAuth(event: H3Event): Promise<AuthContext | null> {
  const ctx = event.context as { auth?: AuthContext | null };
  if (ctx.auth !== undefined) {
    return ctx.auth ?? null;
  }

  const token = getCookie(event, SESSION_COOKIE);
  if (!token) {
    ctx.auth = null;
    return null;
  }

  const session = getSessionByToken(token);
  if (!session) {
    deleteCookie(event, SESSION_COOKIE, cookieOptions());
    event.context.auth = null;
    return null;
  }

  const authContext: AuthContext = {
    user: session.user,
    token,
  };
  ctx.auth = authContext;
  return authContext;
}

export async function requireAuth(event: H3Event): Promise<AuthContext> {
  const auth = await getAuth(event);
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  return auth;
}

export function establishSession(event: H3Event, user: PublicUser) {
  const ctx = event.context as { auth?: AuthContext | null };
  const { token, expiresAt } = createSession(user.id);
  setCookie(event, SESSION_COOKIE, token, {
    ...cookieOptions(),
    expires: new Date(expiresAt),
  });
  ctx.auth = { user, token };
}

export function clearSession(event: H3Event) {
  const ctx = event.context as { auth?: AuthContext | null };
  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    destroySessionByToken(token);
  }
  deleteCookie(event, SESSION_COOKIE, cookieOptions());
  ctx.auth = null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}
