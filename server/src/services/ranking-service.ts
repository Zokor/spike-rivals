import { RANKING } from '@spike-rivals/shared';
import type { RankTier } from '@spike-rivals/shared';
import { updateUserElo, createMatch, updateUserStats } from '../db/queries';

interface EloResult {
  winnerChange: number;
  loserChange: number;
}

export class RankingService {
  static getTierFromElo(elo: number): RankTier {
    for (const [tier, range] of Object.entries(RANKING.TIERS)) {
      if (elo >= range.min && elo <= range.max) {
        return tier as RankTier;
      }
    }
    return 'ROOKIE';
  }

  static getAllTiers(): Array<{ tier: RankTier; min: number; max: number }> {
    return Object.entries(RANKING.TIERS).map(([tier, range]) => ({
      tier: tier as RankTier,
      min: range.min,
      max: range.max,
    }));
  }

  static calculateEloChange(
    winnerElo: number,
    loserElo: number,
    winnerGamesPlayed: number,
    loserGamesPlayed: number
  ): EloResult {
    // Use higher K-factor for new players
    const winnerK = winnerGamesPlayed < 10 ? RANKING.K_FACTOR_NEW : RANKING.K_FACTOR;
    const loserK = loserGamesPlayed < 10 ? RANKING.K_FACTOR_NEW : RANKING.K_FACTOR;

    // Expected score calculation (standard ELO formula)
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 - expectedWinner;

    // Calculate change (winner gets 1, loser gets 0)
    const winnerChange = Math.round(winnerK * (1 - expectedWinner));
    const loserChange = Math.round(loserK * (0 - expectedLoser));

    return {
      winnerChange: Math.max(winnerChange, 1), // Minimum +1 for winner
      loserChange: Math.min(loserChange, -1), // Maximum -1 for loser
    };
  }

  static calculateCoinsEarned(isWinner: boolean, eloChange: number): number {
    if (isWinner) {
      // Base coins + bonus based on ELO change
      return 50 + Math.abs(eloChange) * 2;
    }
    // Consolation coins for losing
    return 10;
  }

  static async recordMatchResult(
    winnerId: string,
    loserId: string,
    winnerScore: number,
    loserScore: number,
    winnerElo: number,
    loserElo: number,
    winnerGamesPlayed: number,
    loserGamesPlayed: number,
    mode: string,
    duration: number
  ): Promise<{
    winnerEloChange: number;
    loserEloChange: number;
    winnerCoins: number;
    loserCoins: number;
  }> {
    // Calculate ELO changes
    const { winnerChange, loserChange } = this.calculateEloChange(
      winnerElo,
      loserElo,
      winnerGamesPlayed,
      loserGamesPlayed
    );

    // Calculate coins
    const winnerCoins = this.calculateCoinsEarned(true, winnerChange);
    const loserCoins = this.calculateCoinsEarned(false, loserChange);

    // Update database
    await Promise.all([
      updateUserElo(winnerId, winnerChange),
      updateUserElo(loserId, loserChange),
      updateUserStats(winnerId, true, winnerCoins),
      updateUserStats(loserId, false, loserCoins),
      createMatch({
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        mode,
        duration,
        winnerEloChange: winnerChange,
        loserEloChange: loserChange,
      }),
    ]);

    return {
      winnerEloChange: winnerChange,
      loserEloChange: loserChange,
      winnerCoins,
      loserCoins,
    };
  }
}
