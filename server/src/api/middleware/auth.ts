import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../../config';

export interface JwtPayload {
  userId: string;
  username: string;
  exp: number;
}

export const jwtPlugin = new Elysia({ name: 'jwt-plugin' }).use(
  jwt({
    name: 'jwt',
    secret: env.JWT_SECRET,
  })
);

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(jwtPlugin)
  .derive(async ({ headers, jwt }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = authHeader.slice(7);

    try {
      const payload = (await jwt.verify(token)) as JwtPayload | false;
      if (!payload) {
        return { user: null };
      }
      return { user: payload };
    } catch {
      return { user: null };
    }
  });

export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authMiddleware)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }
  });
