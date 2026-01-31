import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { getUserById, getUserMatches, getUserItems } from '../../db/queries';
import { RankingService } from '../../services/ranking-service';

export const userRoutes = new Elysia({ prefix: '/user' })
  .use(authMiddleware)
  .get('/profile/:id', async ({ params, set }) => {
    const user = await getUserById(params.id);
    if (!user) {
      set.status = 404;
      return { success: false, error: 'User not found' };
    }

    const tier = RankingService.getTierFromElo(user.elo);

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        elo: user.elo,
        tier,
        coins: user.coins,
        gems: user.gems,
        gamesPlayed: user.gamesPlayed,
        wins: user.wins,
        losses: user.losses,
        winRate: user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0,
        selectedCharacter: user.selectedCharacter,
      },
    };
  })
  .get('/profile/:id/matches', async ({ params, query }) => {
    const limit = query.limit ? parseInt(query.limit) : 10;
    const matches = await getUserMatches(params.id, limit);

    return {
      success: true,
      data: matches,
    };
  })
  .get('/profile/:id/inventory', async ({ params }) => {
    const items = await getUserItems(params.id);

    return {
      success: true,
      data: items,
    };
  })
  .put(
    '/character',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: 'Unauthorized' };
      }

      // TODO: Update user's selected character in database
      return {
        success: true,
        data: { selectedCharacter: body.characterId },
      };
    },
    {
      body: t.Object({
        characterId: t.String(),
      }),
    }
  );
