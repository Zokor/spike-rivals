import { RANKING, type RankTier } from '@spike-rivals/shared';

// ============================================================================
// Types
// ============================================================================

export interface EloCalculationResult {
  winnerNewElo: number;
  loserNewElo: number;
  winnerChange: number;
  loserChange: number;
}

export interface RankProgress {
  currentTier: RankTier;
  currentElo: number;
  tierMin: number;
  tierMax: number;
  progressPercent: number;
  eloToNextTier: number | null;
  nextTier: RankTier | null;
  eloToTierFloor: number;
  prevTier: RankTier | null;
}

export interface MatchEloPreview {
  currentElo: number;
  opponentElo: number;
  expectedWinChance: number;
  eloIfWin: number;
  eloIfLose: number;
  changeIfWin: number;
  changeIfLose: number;
  tierIfWin: RankTier;
  tierIfLose: RankTier;
  wouldPromote: boolean;
  wouldDemote: boolean;
}

export interface EloServiceConfig {
  // Base K-factor for established players
  kFactor: number;
  // K-factor for new players (< provisionalGames)
  kFactorNew: number;
  // Number of games considered "provisional"
  provisionalGames: number;
  // Minimum ELO floor
  minElo: number;
  // Win streak bonus multiplier (percent per streak game)
  winStreakBonus: number;
  // Maximum win streak bonus
  maxWinStreakBonus: number;
}

const DEFAULT_CONFIG: EloServiceConfig = {
  kFactor: RANKING.K_FACTOR,
  kFactorNew: RANKING.K_FACTOR_NEW,
  provisionalGames: 10,
  minElo: 0,
  winStreakBonus: 0.05, // 5% bonus per streak game
  maxWinStreakBonus: 0.25, // Max 25% bonus
};

// ============================================================================
// EloService Class
// ============================================================================

export class EloService {
  private config: EloServiceConfig;

  constructor(config: Partial<EloServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // ELO Calculations
  // ============================================================================

  /**
   * Calculate expected win probability
   * Returns value between 0 and 1
   */
  calculateExpectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  /**
   * Get K-factor based on games played
   */
  getKFactor(gamesPlayed: number): number {
    return gamesPlayed < this.config.provisionalGames
      ? this.config.kFactorNew
      : this.config.kFactor;
  }

  /**
   * Calculate ELO change for a match result
   */
  calculateEloChange(
    winnerElo: number,
    loserElo: number,
    winnerGamesPlayed: number,
    loserGamesPlayed: number,
    winnerStreak: number = 0
  ): EloCalculationResult {
    // Get K-factors
    const winnerK = this.getKFactor(winnerGamesPlayed);
    const loserK = this.getKFactor(loserGamesPlayed);

    // Calculate expected scores
    const expectedWinner = this.calculateExpectedScore(winnerElo, loserElo);
    const expectedLoser = 1 - expectedWinner;

    // Calculate base change
    let winnerChange = Math.round(winnerK * (1 - expectedWinner));
    const loserChange = Math.round(loserK * (0 - expectedLoser));

    // Apply win streak bonus to winner
    if (winnerStreak > 0) {
      const streakBonus = Math.min(
        this.config.maxWinStreakBonus,
        winnerStreak * this.config.winStreakBonus
      );
      winnerChange = Math.round(winnerChange * (1 + streakBonus));
    }

    // Ensure minimum changes
    winnerChange = Math.max(winnerChange, 1);
    const finalLoserChange = Math.min(loserChange, -1);

    // Calculate new ELOs
    const winnerNewElo = Math.max(this.config.minElo, winnerElo + winnerChange);
    const loserNewElo = Math.max(this.config.minElo, loserElo + finalLoserChange);

    return {
      winnerNewElo,
      loserNewElo,
      winnerChange,
      loserChange: finalLoserChange,
    };
  }

  /**
   * Preview ELO changes before a match
   */
  previewMatch(
    playerElo: number,
    opponentElo: number,
    playerGamesPlayed: number,
    opponentGamesPlayed: number,
    playerStreak: number = 0
  ): MatchEloPreview {
    // Calculate if player wins
    const ifWin = this.calculateEloChange(
      playerElo,
      opponentElo,
      playerGamesPlayed,
      opponentGamesPlayed,
      playerStreak
    );

    // Calculate if player loses
    const ifLose = this.calculateEloChange(
      opponentElo,
      playerElo,
      opponentGamesPlayed,
      playerGamesPlayed,
      0 // Opponent's streak doesn't affect player's preview
    );

    const currentTier = this.getTierFromElo(playerElo);
    const tierIfWin = this.getTierFromElo(ifWin.winnerNewElo);
    const tierIfLose = this.getTierFromElo(ifLose.loserNewElo);

    return {
      currentElo: playerElo,
      opponentElo,
      expectedWinChance: this.calculateExpectedScore(playerElo, opponentElo),
      eloIfWin: ifWin.winnerNewElo,
      eloIfLose: ifLose.loserNewElo,
      changeIfWin: ifWin.winnerChange,
      changeIfLose: ifLose.loserChange,
      tierIfWin,
      tierIfLose,
      wouldPromote: tierIfWin !== currentTier && this.getTierIndex(tierIfWin) > this.getTierIndex(currentTier),
      wouldDemote: tierIfLose !== currentTier && this.getTierIndex(tierIfLose) < this.getTierIndex(currentTier),
    };
  }

  // ============================================================================
  // Rank Tier Functions
  // ============================================================================

  /**
   * Get rank tier from ELO value
   */
  getTierFromElo(elo: number): RankTier {
    for (const [tier, range] of Object.entries(RANKING.TIERS)) {
      if (elo >= range.min && elo <= range.max) {
        return tier as RankTier;
      }
    }
    return 'ROOKIE';
  }

  /**
   * Get tier index for comparison (higher = better)
   */
  getTierIndex(tier: RankTier): number {
    const tiers: RankTier[] = ['ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'CHAMPION'];
    return tiers.indexOf(tier);
  }

  /**
   * Get tier boundaries
   */
  getTierRange(tier: RankTier): { min: number; max: number } {
    return RANKING.TIERS[tier];
  }

  /**
   * Get all tier information
   */
  getAllTiers(): Array<{ tier: RankTier; min: number; max: number }> {
    return Object.entries(RANKING.TIERS).map(([tier, range]) => ({
      tier: tier as RankTier,
      min: range.min,
      max: range.max,
    }));
  }

  /**
   * Calculate detailed rank progress
   */
  getRankProgress(elo: number): RankProgress {
    const currentTier = this.getTierFromElo(elo);
    const tierRange = this.getTierRange(currentTier);
    const tierIndex = this.getTierIndex(currentTier);
    const allTiers = this.getAllTiers();

    // Calculate progress within current tier
    const tierSpan = tierRange.max - tierRange.min;
    const eloInTier = elo - tierRange.min;
    const progressPercent = tierSpan > 0 ? Math.round((eloInTier / tierSpan) * 100) : 100;

    // Next tier info
    const nextTierData = allTiers[tierIndex + 1] || null;
    const eloToNextTier = nextTierData ? nextTierData.min - elo : null;

    // Previous tier info
    const prevTierData = allTiers[tierIndex - 1] || null;

    return {
      currentTier,
      currentElo: elo,
      tierMin: tierRange.min,
      tierMax: tierRange.max,
      progressPercent: Math.max(0, Math.min(100, progressPercent)),
      eloToNextTier,
      nextTier: nextTierData?.tier || null,
      eloToTierFloor: elo - tierRange.min,
      prevTier: prevTierData?.tier || null,
    };
  }

  // ============================================================================
  // Display Helpers
  // ============================================================================

  /**
   * Get tier display name
   */
  getTierDisplayName(tier: RankTier): string {
    const names: Record<RankTier, string> = {
      ROOKIE: 'Rookie',
      BRONZE: 'Bronze',
      SILVER: 'Silver',
      GOLD: 'Gold',
      PLATINUM: 'Platinum',
      DIAMOND: 'Diamond',
      CHAMPION: 'Champion',
    };
    return names[tier];
  }

  /**
   * Get tier color (hex)
   */
  getTierColor(tier: RankTier): string {
    const colors: Record<RankTier, string> = {
      ROOKIE: '#808080',    // Gray
      BRONZE: '#CD7F32',    // Bronze
      SILVER: '#C0C0C0',    // Silver
      GOLD: '#FFD700',      // Gold
      PLATINUM: '#E5E4E2',  // Platinum
      DIAMOND: '#B9F2FF',   // Diamond blue
      CHAMPION: '#FF4500',  // Champion orange/red
    };
    return colors[tier];
  }

  /**
   * Get tier icon name (for sprite/image lookup)
   */
  getTierIcon(tier: RankTier): string {
    return `rank_${tier.toLowerCase()}`;
  }

  /**
   * Format ELO change for display
   */
  formatEloChange(change: number): string {
    if (change > 0) {
      return `+${change}`;
    }
    return `${change}`;
  }

  /**
   * Format win chance as percentage
   */
  formatWinChance(chance: number): string {
    return `${Math.round(chance * 100)}%`;
  }

  /**
   * Get motivational message based on match preview
   */
  getMatchupMessage(preview: MatchEloPreview): string {
    const winChance = preview.expectedWinChance;

    if (winChance >= 0.7) {
      return 'Favored matchup - prove your skill!';
    } else if (winChance >= 0.55) {
      return 'Slight advantage - stay focused!';
    } else if (winChance >= 0.45) {
      return 'Even matchup - may the best player win!';
    } else if (winChance >= 0.3) {
      return 'Underdog fight - upset potential!';
    } else {
      return 'Giant slayer opportunity - big ELO gains!';
    }
  }

  /**
   * Calculate coins earned from match result
   */
  calculateMatchCoins(isWinner: boolean, eloChange: number): number {
    if (isWinner) {
      // Base 50 coins + 2 per ELO gained
      return 50 + Math.abs(eloChange) * 2;
    }
    // Consolation coins
    return 10;
  }

  /**
   * Calculate XP earned from match result
   */
  calculateMatchXP(isWinner: boolean): number {
    return isWinner ? 50 : 20;
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const eloService = new EloService();

// ============================================================================
// Factory function
// ============================================================================

export function createEloService(config?: Partial<EloServiceConfig>): EloService {
  return new EloService(config);
}
