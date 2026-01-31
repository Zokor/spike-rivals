import { Elysia } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { getUserMatches } from '../../db/queries';

export const matchesRoutes = new Elysia({ prefix: '/matches' })
  .use(authMiddleware)
  .get('/history', async ({ user, query, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const limit = query.limit ? parseInt(query.limit) : 20;
    const matches = await getUserMatches(user.userId, limit);

    return {
      success: true,
      data: matches,
    };
  })
  .get('/stats', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const matches = await getUserMatches(user.userId, 100);

    // Calculate stats
    const wins = matches.filter((m) => m.winnerId === user.userId).length;
    const losses = matches.length - wins;
    const totalPoints = matches.reduce((sum, m) => {
      if (m.winnerId === user.userId) {
        return sum + m.winnerScore;
      }
      return sum + m.loserScore;
    }, 0);

    const avgPointsPerMatch = matches.length > 0 ? totalPoints / matches.length : 0;

    return {
      success: true,
      data: {
        totalMatches: matches.length,
        wins,
        losses,
        winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
        avgPointsPerMatch: Math.round(avgPointsPerMatch * 10) / 10,
        recentMatches: matches.slice(0, 5),
      },
    };
  });
