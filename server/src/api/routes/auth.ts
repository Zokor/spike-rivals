import { Elysia, t } from 'elysia';
import { jwtPlugin } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import {
  getUserByUsername,
  getUserByEmail,
  createUser,
  getUserById,
  updateUserLogin,
} from '../../db/queries';
import { RedisClient } from '../../services/redis-client';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const BLACKLIST_EXPIRY = 60 * 60 * 24 * 7; // 7 days (max token lifetime)

// Password reset token expiry
const RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour

// Format user data for response
function formatUserResponse(user: {
  id: string;
  username: string;
  email: string | null;
  elo: number;
  rankTier: string;
  coins: number;
  gems: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  selectedCharacter: string;
  selectedBall: string;
  selectedCourt: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastMatchAt: Date | null;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    elo: user.elo,
    rankTier: user.rankTier,
    coins: user.coins,
    gems: user.gems,
    stats: {
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      winRate: user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0,
      winStreak: user.winStreak,
      bestWinStreak: user.bestWinStreak,
    },
    loadout: {
      character: user.selectedCharacter,
      ball: user.selectedBall,
      court: user.selectedCourt,
    },
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    lastMatchAt: user.lastMatchAt?.toISOString() || null,
  };
}

// Generate a random reset token
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  // Strict rate limit for auth endpoints (5 requests per minute)
  .use(rateLimit({ windowMs: 60000, maxRequests: 5 }))

  // ============================================================================
  // POST /auth/register - Create new account
  // ============================================================================
  .post(
    '/register',
    async ({ body, jwt, set }) => {
      const { username, password, email } = body;

      // Validate username format (alphanumeric, underscores allowed)
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        set.status = 400;
        return {
          success: false,
          error: 'Username can only contain letters, numbers, and underscores',
        };
      }

      // Check if username exists
      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        set.status = 400;
        return { success: false, error: 'Username already taken' };
      }

      // Check if email exists (if provided)
      if (email) {
        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
          set.status = 400;
          return { success: false, error: 'Email already registered' };
        }
      }

      // Hash password
      const passwordHash = await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      // Create user
      const user = await createUser({
        username,
        passwordHash,
        email: email || undefined,
      });

      // Update login timestamp
      await updateUserLogin(user.id);

      // Generate access token
      const accessToken = await jwt.sign({
        userId: user.id,
        username: user.username,
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
      });

      // Generate refresh token
      const refreshToken = await jwt.sign({
        userId: user.id,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: ACCESS_TOKEN_EXPIRY,
          user: formatUserResponse(user),
        },
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 20 }),
        password: t.String({ minLength: 6, maxLength: 128 }),
        email: t.Optional(t.String({ format: 'email' })),
      }),
    }
  )

  // ============================================================================
  // POST /auth/login - Authenticate user
  // ============================================================================
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      // Find user by email or username
      let user = await getUserByEmail(email);
      if (!user) {
        // Try finding by username
        user = await getUserByUsername(email);
      }

      if (!user) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const validPassword = await Bun.password.verify(password, user.passwordHash);
      if (!validPassword) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      // Update login timestamp
      await updateUserLogin(user.id);

      // Generate access token
      const accessToken = await jwt.sign({
        userId: user.id,
        username: user.username,
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
      });

      // Generate refresh token
      const refreshToken = await jwt.sign({
        userId: user.id,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: ACCESS_TOKEN_EXPIRY,
          user: formatUserResponse(user),
        },
      };
    },
    {
      body: t.Object({
        email: t.String(), // Can be email or username
        password: t.String(),
      }),
    }
  )

  // ============================================================================
  // POST /auth/logout - Invalidate token
  // ============================================================================
  .post('/logout', async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return { success: false, error: 'No token provided' };
    }

    const token = authHeader.slice(7);

    try {
      const payload = await jwt.verify(token);
      if (!payload || typeof payload !== 'object') {
        set.status = 401;
        return { success: false, error: 'Invalid token' };
      }

      // Add token to blacklist in Redis
      await RedisClient.set(`blacklist:${token}`, '1', BLACKLIST_EXPIRY);

      return { success: true, message: 'Logged out successfully' };
    } catch {
      // Token is invalid anyway, consider it logged out
      return { success: true, message: 'Logged out successfully' };
    }
  })

  // ============================================================================
  // POST /auth/refresh - Refresh access token
  // ============================================================================
  .post(
    '/refresh',
    async ({ body, jwt, set }) => {
      const { refreshToken } = body;

      try {
        // Verify refresh token
        const payload = await jwt.verify(refreshToken);
        if (!payload || typeof payload !== 'object' || payload.type !== 'refresh') {
          set.status = 401;
          return { success: false, error: 'Invalid refresh token' };
        }

        // Check if token is blacklisted
        const isBlacklisted = await RedisClient.get(`blacklist:${refreshToken}`);
        if (isBlacklisted) {
          set.status = 401;
          return { success: false, error: 'Token has been revoked' };
        }

        const userId = payload.userId as string;

        // Get user
        const user = await getUserById(userId);
        if (!user) {
          set.status = 401;
          return { success: false, error: 'User not found' };
        }

        // Generate new access token
        const accessToken = await jwt.sign({
          userId: user.id,
          username: user.username,
          type: 'access',
          exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
        });

        // Optionally rotate refresh token
        const newRefreshToken = await jwt.sign({
          userId: user.id,
          type: 'refresh',
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
        });

        // Blacklist old refresh token
        await RedisClient.set(`blacklist:${refreshToken}`, '1', BLACKLIST_EXPIRY);

        return {
          success: true,
          data: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRY,
          },
        };
      } catch {
        set.status = 401;
        return { success: false, error: 'Invalid refresh token' };
      }
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )

  // ============================================================================
  // GET /auth/me - Get current user
  // ============================================================================
  .get('/me', async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const token = authHeader.slice(7);

    try {
      // Check if token is blacklisted
      const isBlacklisted = await RedisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        set.status = 401;
        return { success: false, error: 'Token has been revoked' };
      }

      const payload = await jwt.verify(token);

      if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
        set.status = 401;
        return { success: false, error: 'Invalid token' };
      }

      const user = await getUserById(payload.userId as string);
      if (!user) {
        set.status = 401;
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        data: formatUserResponse(user),
      };
    } catch {
      set.status = 401;
      return { success: false, error: 'Invalid token' };
    }
  })

  // ============================================================================
  // POST /auth/forgot-password - Request password reset
  // ============================================================================
  .post(
    '/forgot-password',
    async ({ body, set }) => {
      const { email } = body;

      const user = await getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return {
          success: true,
          message: 'If an account with that email exists, a reset link has been sent',
        };
      }

      // Generate reset token
      const resetToken = generateResetToken();

      // Store in Redis with expiry
      await RedisClient.set(
        `password_reset:${resetToken}`,
        JSON.stringify({ userId: user.id, email }),
        RESET_TOKEN_EXPIRY
      );

      // TODO: Send email with reset link
      // For now, just log it (in production, integrate with email service)
      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

      return {
        success: true,
        message: 'If an account with that email exists, a reset link has been sent',
        // In development, return the token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
      }),
    }
  )

  // ============================================================================
  // POST /auth/reset-password - Reset password with token
  // ============================================================================
  .post(
    '/reset-password',
    async ({ body, set }) => {
      const { token, newPassword } = body;

      // Get reset data from Redis
      const resetData = await RedisClient.get(`password_reset:${token}`);
      if (!resetData) {
        set.status = 400;
        return { success: false, error: 'Invalid or expired reset token' };
      }

      const { userId } = JSON.parse(resetData);

      // Hash new password
      const passwordHash = await Bun.password.hash(newPassword, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      // Update password in database
      const { db } = await import('../../db');
      const { users } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');

      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Delete reset token
      await RedisClient.del(`password_reset:${token}`);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    },
    {
      body: t.Object({
        token: t.String({ minLength: 64, maxLength: 64 }),
        newPassword: t.String({ minLength: 6, maxLength: 128 }),
      }),
    }
  )

  // ============================================================================
  // POST /auth/change-password - Change password (authenticated)
  // ============================================================================
  .post(
    '/change-password',
    async ({ body, headers, jwt, set }) => {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        set.status = 401;
        return { success: false, error: 'Unauthorized' };
      }

      const token = authHeader.slice(7);
      const payload = await jwt.verify(token);

      if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
        set.status = 401;
        return { success: false, error: 'Invalid token' };
      }

      const user = await getUserById(payload.userId as string);
      if (!user) {
        set.status = 401;
        return { success: false, error: 'User not found' };
      }

      const { currentPassword, newPassword } = body;

      // Verify current password
      const validPassword = await Bun.password.verify(currentPassword, user.passwordHash);
      if (!validPassword) {
        set.status = 400;
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const passwordHash = await Bun.password.hash(newPassword, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      // Update password
      const { db } = await import('../../db');
      const { users } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');

      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: 'Password changed successfully',
      };
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({ minLength: 6, maxLength: 128 }),
      }),
    }
  )

  // ============================================================================
  // GET /auth/validate - Validate token (for other services)
  // ============================================================================
  .get('/validate', async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return { valid: false };
    }

    const token = authHeader.slice(7);

    try {
      // Check blacklist
      const isBlacklisted = await RedisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        set.status = 401;
        return { valid: false };
      }

      const payload = await jwt.verify(token);
      if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
        set.status = 401;
        return { valid: false };
      }

      return {
        valid: true,
        userId: payload.userId,
        username: payload.username,
      };
    } catch {
      set.status = 401;
      return { valid: false };
    }
  });
