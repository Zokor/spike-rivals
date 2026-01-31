import { Elysia } from 'elysia';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
  return new Elysia({ name: 'rate-limit' }).onBeforeHandle(({ request, set }) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + config.windowMs });
      return;
    }

    record.count++;

    if (record.count > config.maxRequests) {
      set.status = 429;
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }
  });
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60000);
