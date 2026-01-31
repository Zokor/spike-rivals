import { RedisClient } from './redis-client';
import { RankingService } from './ranking-service';
import { RANKING } from '@spike-rivals/shared';
import type { RankTier } from '@spike-rivals/shared';

// Redis keys
const QUEUE_KEY = 'matchmaking:queue'; // Sorted set: score = timestamp
const PLAYER_DATA_KEY = 'matchmaking:players'; // Hash: playerId -> JSON data
const MATCH_COUNTER_KEY = 'matchmaking:match_counter';

// ELO range expansion thresholds
const ELO_EXPANSION_CONFIG = [
  { afterSeconds: 0, range: 100 }, // Initial: ±100 ELO
  { afterSeconds: 10, range: 200 }, // After 10s: ±200 ELO
  { afterSeconds: 30, range: 400 }, // After 30s: ±400 ELO
  { afterSeconds: 60, range: Infinity }, // After 60s: match anyone
];

// Matching loop interval
const MATCH_LOOP_INTERVAL_MS = 2000; // 2 seconds

// Queue timeout
const QUEUE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max in queue

/**
 * Player preferences for matchmaking
 */
export interface MatchPreferences {
  region?: string; // e.g., 'na', 'eu', 'asia'
  gameMode?: 'ranked' | 'casual';
  preferSameTier?: boolean;
}

/**
 * Player data stored in queue
 */
export interface QueuedPlayer {
  odUserId: string;
  sessionId: string;
  username: string;
  elo: number;
  tier: RankTier;
  characterId: string;
  region: string;
  joinedAt: number; // Timestamp
  preferences: MatchPreferences;
}

/**
 * Match result from matchmaking
 */
export interface MatchResult {
  matchId: string;
  player1: QueuedPlayer;
  player2: QueuedPlayer;
  eloDifference: number;
  avgWaitTime: number;
  region: string;
}

/**
 * Queue status for a player
 */
export interface QueueStatus {
  inQueue: boolean;
  position: number;
  estimatedWait: number; // seconds
  currentEloRange: number;
  playersInRange: number;
  totalInQueue: number;
}

/**
 * Matchmaking service for ranked volleyball matches
 */
export class MatchmakingService {
  private static matchLoopRunning = false;
  private static matchLoopInterval: ReturnType<typeof setInterval> | null = null;
  private static matchHandlers: Array<(match: MatchResult) => void> = [];

  // ==================== Queue Management ====================

  /**
   * Add a player to the matchmaking queue
   */
  static async joinQueue(
    odUserId: string,
    sessionId: string,
    username: string,
    elo: number,
    characterId: string,
    preferences: MatchPreferences = {}
  ): Promise<{ success: boolean; position: number; error?: string }> {
    try {
      const redis = RedisClient.getInstance();

      // Check if player is already in queue
      const existing = await redis.hGet(PLAYER_DATA_KEY, odUserId);
      if (existing) {
        return { success: false, position: -1, error: 'Already in queue' };
      }

      const tier = RankingService.getTierFromElo(elo);
      const joinedAt = Date.now();

      const playerData: QueuedPlayer = {
        odUserId,
        sessionId,
        username,
        elo,
        tier,
        characterId,
        region: preferences.region || 'global',
        joinedAt,
        preferences,
      };

      // Add to sorted set (score = timestamp for FIFO ordering)
      await redis.zAdd(QUEUE_KEY, { score: joinedAt, value: odUserId });

      // Store player data in hash
      await redis.hSet(PLAYER_DATA_KEY, odUserId, JSON.stringify(playerData));

      // Get position in queue
      const position = await redis.zRank(QUEUE_KEY, odUserId);

      console.log(`[Matchmaking] ${username} (${elo} ELO) joined queue at position ${(position ?? 0) + 1}`);

      return { success: true, position: (position ?? 0) + 1 };
    } catch (error) {
      console.error('[Matchmaking] Error joining queue:', error);
      return { success: false, position: -1, error: 'Failed to join queue' };
    }
  }

  /**
   * Remove a player from the matchmaking queue
   */
  static async leaveQueue(odUserId: string): Promise<boolean> {
    try {
      const redis = RedisClient.getInstance();

      // Remove from sorted set
      await redis.zRem(QUEUE_KEY, odUserId);

      // Remove player data
      await redis.hDel(PLAYER_DATA_KEY, odUserId);

      console.log(`[Matchmaking] Player ${odUserId} left queue`);

      return true;
    } catch (error) {
      console.error('[Matchmaking] Error leaving queue:', error);
      return false;
    }
  }

  /**
   * Get queue status for a player
   */
  static async getQueueStatus(odUserId: string): Promise<QueueStatus> {
    try {
      const redis = RedisClient.getInstance();

      // Check if player is in queue
      const playerDataStr = await redis.hGet(PLAYER_DATA_KEY, odUserId);
      if (!playerDataStr) {
        return {
          inQueue: false,
          position: -1,
          estimatedWait: 0,
          currentEloRange: 0,
          playersInRange: 0,
          totalInQueue: 0,
        };
      }

      const playerData = JSON.parse(playerDataStr) as QueuedPlayer;
      const position = await redis.zRank(QUEUE_KEY, odUserId);
      const totalInQueue = await redis.zCard(QUEUE_KEY);

      // Calculate current ELO range based on wait time
      const waitTime = (Date.now() - playerData.joinedAt) / 1000;
      const currentRange = this.getEloRangeForWaitTime(waitTime);

      // Count players within ELO range
      const playersInRange = await this.countPlayersInRange(playerData.elo, currentRange, playerData.region);

      // Estimate wait time (rough calculation based on queue dynamics)
      const estimatedWait = this.estimateWaitTime(totalInQueue, playersInRange, waitTime);

      return {
        inQueue: true,
        position: (position ?? 0) + 1,
        estimatedWait,
        currentEloRange: currentRange === Infinity ? -1 : currentRange,
        playersInRange,
        totalInQueue,
      };
    } catch (error) {
      console.error('[Matchmaking] Error getting queue status:', error);
      return {
        inQueue: false,
        position: -1,
        estimatedWait: 0,
        currentEloRange: 0,
        playersInRange: 0,
        totalInQueue: 0,
      };
    }
  }

  // ==================== Match Finding ====================

  /**
   * Find a match for players in the queue
   * Returns the best matched pair or null if no suitable match found
   */
  static async findMatch(): Promise<MatchResult | null> {
    try {
      const redis = RedisClient.getInstance();

      // Get all players in queue (ordered by join time)
      const queuedIds = await redis.zRange(QUEUE_KEY, 0, -1);

      if (queuedIds.length < 2) {
        return null;
      }

      // Get all player data
      const playerDataMap = new Map<string, QueuedPlayer>();
      for (const id of queuedIds) {
        const data = await redis.hGet(PLAYER_DATA_KEY, id);
        if (data) {
          playerDataMap.set(id, JSON.parse(data));
        }
      }

      // Remove stale entries (players who have been in queue too long)
      const now = Date.now();
      for (const [id, player] of playerDataMap) {
        if (now - player.joinedAt > QUEUE_TIMEOUT_MS) {
          await this.leaveQueue(id);
          playerDataMap.delete(id);
          console.log(`[Matchmaking] Removed stale player ${player.username} from queue`);
        }
      }

      if (playerDataMap.size < 2) {
        return null;
      }

      // Find best match
      let bestMatch: { player1: QueuedPlayer; player2: QueuedPlayer; score: number } | null = null;

      const players = Array.from(playerDataMap.values());

      for (let i = 0; i < players.length; i++) {
        const player1 = players[i];
        const waitTime1 = (now - player1.joinedAt) / 1000;
        const range1 = this.getEloRangeForWaitTime(waitTime1);

        for (let j = i + 1; j < players.length; j++) {
          const player2 = players[j];
          const waitTime2 = (now - player2.joinedAt) / 1000;
          const range2 = this.getEloRangeForWaitTime(waitTime2);

          // Check if match is valid
          const matchScore = this.calculateMatchScore(player1, player2, range1, range2);

          if (matchScore !== null) {
            if (!bestMatch || matchScore > bestMatch.score) {
              bestMatch = { player1, player2, score: matchScore };
            }
          }
        }
      }

      if (!bestMatch) {
        return null;
      }

      // Remove matched players from queue
      await this.leaveQueue(bestMatch.player1.odUserId);
      await this.leaveQueue(bestMatch.player2.odUserId);

      // Generate match ID
      const matchId = await this.generateMatchId();

      // Calculate match details
      const eloDifference = Math.abs(bestMatch.player1.elo - bestMatch.player2.elo);
      const avgWaitTime = ((now - bestMatch.player1.joinedAt) + (now - bestMatch.player2.joinedAt)) / 2000;

      // Determine region (prefer same region, fallback to global)
      const region = bestMatch.player1.region === bestMatch.player2.region
        ? bestMatch.player1.region
        : 'global';

      const matchResult: MatchResult = {
        matchId,
        player1: bestMatch.player1,
        player2: bestMatch.player2,
        eloDifference,
        avgWaitTime,
        region,
      };

      console.log(
        `[Matchmaking] Match found: ${bestMatch.player1.username} (${bestMatch.player1.elo}) vs ` +
        `${bestMatch.player2.username} (${bestMatch.player2.elo}) - ELO diff: ${eloDifference}`
      );

      return matchResult;
    } catch (error) {
      console.error('[Matchmaking] Error finding match:', error);
      return null;
    }
  }

  /**
   * Calculate match score (higher = better match)
   * Returns null if match is invalid
   */
  private static calculateMatchScore(
    player1: QueuedPlayer,
    player2: QueuedPlayer,
    range1: number,
    range2: number
  ): number | null {
    const eloDiff = Math.abs(player1.elo - player2.elo);
    const maxRange = Math.max(range1, range2);

    // Check ELO range
    if (eloDiff > maxRange && maxRange !== Infinity) {
      return null;
    }

    // Base score (inverse of ELO difference)
    let score = 1000 - eloDiff;

    // Bonus for same tier
    if (player1.tier === player2.tier) {
      score += 200;
    }

    // Bonus for same region
    if (player1.region === player2.region) {
      score += 100;
    }

    // Bonus for preferSameTier preference matching
    if (player1.preferences.preferSameTier && player1.tier === player2.tier) {
      score += 150;
    }
    if (player2.preferences.preferSameTier && player1.tier === player2.tier) {
      score += 150;
    }

    // Priority for longer wait times
    const avgWaitTime = (Date.now() - player1.joinedAt + Date.now() - player2.joinedAt) / 2000;
    score += avgWaitTime * 5; // 5 points per second of combined wait

    return Math.max(0, score);
  }

  // ==================== Match Loop ====================

  /**
   * Start the matchmaking loop
   */
  static startMatchLoop(onMatch: (match: MatchResult) => void): void {
    if (this.matchLoopRunning) {
      console.log('[Matchmaking] Match loop already running');
      return;
    }

    this.matchHandlers.push(onMatch);

    if (!this.matchLoopInterval) {
      this.matchLoopRunning = true;

      this.matchLoopInterval = setInterval(async () => {
        try {
          // Keep finding matches until no more can be made
          let match = await this.findMatch();
          while (match) {
            // Notify all handlers
            this.matchHandlers.forEach(handler => {
              try {
                handler(match!);
              } catch (error) {
                console.error('[Matchmaking] Error in match handler:', error);
              }
            });

            // Try to find another match
            match = await this.findMatch();
          }
        } catch (error) {
          console.error('[Matchmaking] Error in match loop:', error);
        }
      }, MATCH_LOOP_INTERVAL_MS);

      console.log('[Matchmaking] Match loop started');
    }
  }

  /**
   * Stop the matchmaking loop
   */
  static stopMatchLoop(): void {
    if (this.matchLoopInterval) {
      clearInterval(this.matchLoopInterval);
      this.matchLoopInterval = null;
    }
    this.matchLoopRunning = false;
    this.matchHandlers = [];
    console.log('[Matchmaking] Match loop stopped');
  }

  // ==================== Helper Functions ====================

  /**
   * Get ELO range for a given wait time
   */
  private static getEloRangeForWaitTime(waitTimeSeconds: number): number {
    for (let i = ELO_EXPANSION_CONFIG.length - 1; i >= 0; i--) {
      if (waitTimeSeconds >= ELO_EXPANSION_CONFIG[i].afterSeconds) {
        return ELO_EXPANSION_CONFIG[i].range;
      }
    }
    return ELO_EXPANSION_CONFIG[0].range;
  }

  /**
   * Count players within ELO range
   */
  private static async countPlayersInRange(
    elo: number,
    range: number,
    region: string
  ): Promise<number> {
    try {
      const redis = RedisClient.getInstance();
      const allPlayers = await redis.hGetAll(PLAYER_DATA_KEY);

      let count = 0;
      for (const data of Object.values(allPlayers)) {
        const player = JSON.parse(data) as QueuedPlayer;
        const eloDiff = Math.abs(elo - player.elo);

        // Check ELO range
        if (range === Infinity || eloDiff <= range) {
          // Check region (global matches any)
          if (region === 'global' || player.region === 'global' || region === player.region) {
            count++;
          }
        }
      }

      return Math.max(0, count - 1); // Exclude self
    } catch {
      return 0;
    }
  }

  /**
   * Estimate wait time based on queue dynamics
   */
  private static estimateWaitTime(
    totalInQueue: number,
    playersInRange: number,
    currentWaitTime: number
  ): number {
    if (playersInRange > 0) {
      // If there are players in range, estimate short wait
      return Math.max(5, 30 - playersInRange * 5);
    }

    if (totalInQueue > 1) {
      // Players in queue but not in range yet
      // Estimate based on ELO expansion schedule
      const currentRange = this.getEloRangeForWaitTime(currentWaitTime);
      if (currentRange < 400) {
        // Still expanding, estimate when range will be wider
        return 30 - currentWaitTime;
      }
      return 60 - currentWaitTime;
    }

    // Alone in queue
    return 60;
  }

  /**
   * Generate unique match ID
   */
  private static async generateMatchId(): Promise<string> {
    try {
      const redis = RedisClient.getInstance();
      const counter = await redis.incr(MATCH_COUNTER_KEY);
      const timestamp = Date.now().toString(36);
      return `match_${timestamp}_${counter}`;
    } catch {
      // Fallback to random ID
      return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // ==================== Stats & Monitoring ====================

  /**
   * Get overall queue statistics
   */
  static async getQueueStats(): Promise<{
    totalPlayers: number;
    avgWaitTime: number;
    avgElo: number;
    eloDistribution: Record<RankTier, number>;
    regionDistribution: Record<string, number>;
  }> {
    try {
      const redis = RedisClient.getInstance();
      const allPlayers = await redis.hGetAll(PLAYER_DATA_KEY);

      const players = Object.values(allPlayers).map(p => JSON.parse(p) as QueuedPlayer);

      if (players.length === 0) {
        return {
          totalPlayers: 0,
          avgWaitTime: 0,
          avgElo: 0,
          eloDistribution: {} as Record<RankTier, number>,
          regionDistribution: {},
        };
      }

      const now = Date.now();
      const waitTimes = players.map(p => (now - p.joinedAt) / 1000);
      const elos = players.map(p => p.elo);

      // ELO distribution by tier
      const eloDistribution: Record<string, number> = {};
      players.forEach(p => {
        eloDistribution[p.tier] = (eloDistribution[p.tier] || 0) + 1;
      });

      // Region distribution
      const regionDistribution: Record<string, number> = {};
      players.forEach(p => {
        regionDistribution[p.region] = (regionDistribution[p.region] || 0) + 1;
      });

      return {
        totalPlayers: players.length,
        avgWaitTime: waitTimes.reduce((a, b) => a + b, 0) / players.length,
        avgElo: elos.reduce((a, b) => a + b, 0) / players.length,
        eloDistribution: eloDistribution as Record<RankTier, number>,
        regionDistribution,
      };
    } catch (error) {
      console.error('[Matchmaking] Error getting queue stats:', error);
      return {
        totalPlayers: 0,
        avgWaitTime: 0,
        avgElo: 0,
        eloDistribution: {} as Record<RankTier, number>,
        regionDistribution: {},
      };
    }
  }

  /**
   * Clear the entire queue (admin function)
   */
  static async clearQueue(): Promise<void> {
    try {
      const redis = RedisClient.getInstance();
      await redis.del(QUEUE_KEY);
      await redis.del(PLAYER_DATA_KEY);
      console.log('[Matchmaking] Queue cleared');
    } catch (error) {
      console.error('[Matchmaking] Error clearing queue:', error);
    }
  }
}
