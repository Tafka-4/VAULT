import type { H3Event } from 'h3';

type Bucket = {
  hits: number[];
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

function getClientId(event: H3Event) {
  const forwarded = event.node.req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim();
  }
  return event.node.req.socket.remoteAddress || 'unknown';
}

export function enforceRateLimit(event: H3Event, name: string, limit: number, windowMs: number) {
  const client = getClientId(event);
  const key = `${name}:${client}`;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [], limit, windowMs };
  bucket.hits = bucket.hits.filter((ts) => now - ts < bucket.windowMs);

  if (bucket.hits.length >= bucket.limit) {
    throw createRateLimitError();
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
}

function createRateLimitError() {
  const error: any = new Error('Too many attempts. Please wait and try again.');
  error.statusCode = 429;
  return error;
}
