import { Elysia, t } from 'elysia';
import { authMiddleware, requireAuth } from '../middleware/auth';
import {
  getLeaderboard,
  getUserById,
  getUserRank,
  getNearbyPlayers,
  getUserMatches,
} from '../../db/queries';
import { RankingService } from '../../services/ranking-service';
import { RedisClient } from '../../services/redis-client';

// Cache TTL for leaderboard (5 minutes)
const LEADERBOARD_CACHE_TTL = 60 * 5;

export const rankingRoutes = new Elysia({ prefix: '/ranking' })
  .use(authMiddleware)

  // ============================================================================
  // GET /ranking/leaderboard - Get top players
  // ============================================================================
  .get(
    '/leaderboard',
    async ({ query }) => {
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '100')));
      const offset = Math.max(0, parseInt(query.offset || '0'));

      // Try to get from cache
      const cacheKey = `leaderboard:${limit}:${offset}`;
      const cached = await RedisClient.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: JSON.parse(cached),
          cached: true,
        };
      }

      const leaderboard = await getLeaderboard(limit, offset);

      const data = leaderboard.map((user, index) => ({
        rank: offset + index + 1,
        id: user.id,
        username: user.username,
        elo: user.elo,
        tier: RankingService.getTierFromElo(user.elo),
        wins: user.wins,
        losses: user.losses,
        gamesPlayed: user.gamesPlayed,
        winRate: user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0,
        winStreak: user.winStreak,
        bestWinStreak: user.bestWinStreak,
      }));

      // Cache the result
      await RedisClient.set(cacheKey, JSON.stringify(data), LEADERBOARD_CACHE_TTL);

      return {
        success: true,
        data,
        cached: false,
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  // ============================================================================
  // GET /ranking/player/:id - Get specific player's ranking info
  // ============================================================================
  .get('/player/:id', async ({ params, set }) => {
    const user = await getUserById(params.id);
    if (!user) {
      set.status = 404;
      return { success: false, error: 'Player not found' };
    }

    const rank = await getUserRank(params.id);
    const recentMatches = await getUserMatches(params.id, 5);

    // Calculate progress to next tier
    const currentTier = RankingService.getTierFromElo(user.elo);
    const tiers = RankingService.getAllTiers();
    const currentTierData = tiers.find((t) => t.tier === currentTier);
    const currentTierIndex = tiers.findIndex((t) => t.tier === currentTier);
    const nextTier = tiers[currentTierIndex + 1];

    let progressToNextTier = 100;
    let eloToNextTier = 0;

    if (nextTier && currentTierData) {
      const tierRange = currentTierData.max - currentTierData.min;
      const userProgress = user.elo - currentTierData.min;
      progressToNextTier = Math.round((userProgress / tierRange) * 100);
      eloToNextTier = nextTier.min - user.elo;
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        elo: user.elo,
        tier: currentTier,
        rank,
        stats: {
          wins: user.wins,
          losses: user.losses,
          gamesPlayed: user.gamesPlayed,
          winRate: user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0,
          winStreak: user.winStreak,
          bestWinStreak: user.bestWinStreak,
        },
        progress: {
          currentTier,
          nextTier: nextTier?.tier || null,
          progressPercent: progressToNextTier,
          eloToNextTier,
        },
        recentMatches: recentMatches.map((m) => ({
          id: m.id,
          isWinner: m.winnerId === params.id,
          score: m.winnerId === params.id ? `${m.winnerScore}-${m.loserScore}` : `${m.loserScore}-${m.winnerScore}`,
          eloChange: m.winnerId === params.id ? m.winnerEloChange : m.loserEloChange,
          playedAt: m.playedAt.toISOString(),
        })),
      },
    };
  })

  // ============================================================================
  // GET /ranking/me - Get current user's ranking
  // ============================================================================
  .use(requireAuth)
  .get('/me', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const userData = await getUserById(user.userId);
    if (!userData) {
      set.status = 404;
      return { success: false, error: 'User not found' };
    }

    const rank = await getUserRank(user.userId);
    const nearbyPlayers = await getNearbyPlayers(user.userId, 5);

    // Calculate progress to next tier
    const currentTier = RankingService.getTierFromElo(userData.elo);
    const tiers = RankingService.getAllTiers();
    const currentTierData = tiers.find((t) => t.tier === currentTier);
    const currentTierIndex = tiers.findIndex((t) => t.tier === currentTier);
    const nextTier = tiers[currentTierIndex + 1];
    const prevTier = tiers[currentTierIndex - 1];

    let progressToNextTier = 100;
    let eloToNextTier = 0;

    if (nextTier && currentTierData) {
      const tierRange = currentTierData.max - currentTierData.min;
      const userProgress = userData.elo - currentTierData.min;
      progressToNextTier = Math.round((userProgress / tierRange) * 100);
      eloToNextTier = nextTier.min - userData.elo;
    }

    // Get nearby players with their ranks
    const userRankIndex = nearbyPlayers.findIndex((p) => p.id === user.userId);
    const nearbyWithRanks = nearbyPlayers.map((p, index) => ({
      id: p.id,
      username: p.username,
      elo: p.elo,
      tier: RankingService.getTierFromElo(p.elo),
      rank: rank - userRankIndex + index,
      isCurrentUser: p.id === user.userId,
    }));

    return {
      success: true,
      data: {
        rank,
        elo: userData.elo,
        tier: currentTier,
        stats: {
          wins: userData.wins,
          losses: userData.losses,
          gamesPlayed: userData.gamesPlayed,
          winRate: userData.gamesPlayed > 0 ? Math.round((userData.wins / userData.gamesPlayed) * 100) : 0,
          winStreak: userData.winStreak,
          bestWinStreak: userData.bestWinStreak,
        },
        progress: {
          currentTier,
          nextTier: nextTier?.tier || null,
          prevTier: prevTier?.tier || null,
          progressPercent: progressToNextTier,
          eloToNextTier,
          eloFloor: currentTierData?.min || 0,
        },
        nearbyPlayers: nearbyWithRanks,
      },
    };
  })

  // ============================================================================
  // GET /ranking/tiers - Get all rank tiers
  // ============================================================================
  .get('/tiers', () => {
    return {
      success: true,
      data: RankingService.getAllTiers(),
    };
  })

  // ============================================================================
  // GET /ranking/seasons - Get season history (placeholder)
  // ============================================================================
  .get('/seasons', async () => {
    // TODO: Implement seasons table and queries
    // For now, return current season info
    const currentSeason = {
      id: 1,
      name: 'Season 1',
      startDate: '2024-01-01T00:00:00Z',
      endDate: null, // ongoing
      rewards: [
        { tier: 'CHAMPION', reward: 'Exclusive Champion Border' },
        { tier: 'DIAMOND', reward: '500 Gems' },
        { tier: 'PLATINUM', reward: '300 Gems' },
        { tier: 'GOLD', reward: '150 Gems' },
        { tier: 'SILVER', reward: '75 Gems' },
        { tier: 'BRONZE', reward: '50 Gems' },
      ],
    };

    return {
      success: true,
      data: {
        current: currentSeason,
        history: [],
      },
    };
  })

  // ============================================================================
  // GET /ranking/stats - Get global ranking statistics
  // ============================================================================
  .get('/stats', async () => {
    // Try to get from cache
    const cacheKey = 'ranking:stats';
    const cached = await RedisClient.get(cacheKey);
    if (cached) {
      return {
        success: true,
        data: JSON.parse(cached),
        cached: true,
      };
    }

    // Get top 1000 players for stats
    const players = await getLeaderboard(1000, 0);

    // Calculate distribution
    const tierCounts: Record<string, number> = {
      CHAMPION: 0,
      DIAMOND: 0,
      PLATINUM: 0,
      GOLD: 0,
      SILVER: 0,
      BRONZE: 0,
      ROOKIE: 0,
    };

    let totalGames = 0;
    let totalElo = 0;

    for (const player of players) {
      const tier = RankingService.getTierFromElo(player.elo);
      tierCounts[tier]++;
      totalGames += player.gamesPlayed;
      totalElo += player.elo;
    }

    const stats = {
      totalPlayers: players.length,
      averageElo: players.length > 0 ? Math.round(totalElo / players.length) : 1000,
      totalGamesPlayed: totalGames,
      tierDistribution: Object.entries(tierCounts).map(([tier, count]) => ({
        tier,
        count,
        percentage: players.length > 0 ? Math.round((count / players.length) * 100) : 0,
      })),
    };

    // Cache for 5 minutes
    await RedisClient.set(cacheKey, JSON.stringify(stats), LEADERBOARD_CACHE_TTL);

    return {
      success: true,
      data: stats,
      cached: false,
    };
  });
