import {
  getUserBattlePass,
  createUserBattlePass,
  addBattlePassXP,
  upgradeToPremiumBattlePass,
  claimBattlePassReward,
  getBattlePassRewards,
  updateUserCurrency,
  createTransaction,
} from '../db/queries';
import { InventoryService } from './inventory-service';

// ============================================================================
// Configuration
// ============================================================================

export interface BattlePassConfig {
  // Season duration in days
  seasonDurationDays: number;
  // Total tiers
  totalTiers: number;
  // Base XP per tier (increases slightly each tier)
  baseXpPerTier: number;
  // XP increase per tier
  xpIncreasePerTier: number;
  // Premium price in gems
  premiumPriceGems: number;
  // Tier skip price in gems
  tierSkipPriceGems: number;
}

const DEFAULT_CONFIG: BattlePassConfig = {
  seasonDurationDays: 56, // 8 weeks
  totalTiers: 50,
  baseXpPerTier: 1000,
  xpIncreasePerTier: 50, // Each tier needs 50 more XP
  premiumPriceGems: 500,
  tierSkipPriceGems: 100,
};

export const BATTLE_PASS_CONFIG = DEFAULT_CONFIG;

// ============================================================================
// XP Sources
// ============================================================================

export const XP_SOURCES = {
  WIN_MATCH: 50,
  LOSE_MATCH: 20,
  DAILY_LOGIN: 25,
  DAILY_CHALLENGE: 100,
  WEEKLY_CHALLENGE: 500,
  FIRST_WIN_OF_DAY: 75, // Bonus on top of WIN_MATCH
} as const;

// ============================================================================
// Reward Types
// ============================================================================

export type RewardType = 'coins' | 'gems' | 'skin' | 'character_skin' | 'ball_skin' | 'court' | 'xp_boost' | 'emote';

export interface BattlePassReward {
  tier: number;
  rewardType: RewardType;
  rewardId: string | null;
  rewardAmount: number | null;
  isPremium: boolean;
}

export interface BattlePassProgress {
  season: number;
  currentTier: number;
  currentXp: number;
  xpForCurrentTier: number;
  xpForNextTier: number;
  progressPercent: number;
  isPremium: boolean;
  purchasedAt: string | null;
  claimedFreeTiers: number[];
  claimedPremiumTiers: number[];
  unclaimedFreeRewards: number;
  unclaimedPremiumRewards: number;
  daysRemaining: number;
}

export interface TierUpResult {
  previousTier: number;
  newTier: number;
  tiersGained: number;
  newXp: number;
  unlockedRewards: BattlePassReward[];
}

// ============================================================================
// BattlePassService Class
// ============================================================================

export class BattlePassService {
  private config: BattlePassConfig;
  private currentSeason: number;
  private seasonStartDate: Date;

  constructor(config: Partial<BattlePassConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // TODO: Load from database/config
    this.currentSeason = 1;
    this.seasonStartDate = new Date('2024-01-01T00:00:00Z');
  }

  // ============================================================================
  // Season Management
  // ============================================================================

  getCurrentSeason(): number {
    return this.currentSeason;
  }

  getSeasonEndDate(): Date {
    const endDate = new Date(this.seasonStartDate);
    endDate.setDate(endDate.getDate() + this.config.seasonDurationDays);
    return endDate;
  }

  getDaysRemaining(): number {
    const now = new Date();
    const endDate = this.getSeasonEndDate();
    const diffMs = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // ============================================================================
  // XP Calculations
  // ============================================================================

  /**
   * Get XP required for a specific tier
   */
  getXpForTier(tier: number): number {
    if (tier <= 0) return 0;
    return this.config.baseXpPerTier + (tier - 1) * this.config.xpIncreasePerTier;
  }

  /**
   * Get total XP required to reach a tier from 0
   */
  getTotalXpForTier(tier: number): number {
    let total = 0;
    for (let i = 1; i <= tier; i++) {
      total += this.getXpForTier(i);
    }
    return total;
  }

  /**
   * Calculate tier from total XP
   */
  getTierFromXp(totalXp: number): { tier: number; xpInTier: number } {
    let tier = 0;
    let remainingXp = totalXp;

    while (tier < this.config.totalTiers) {
      const xpNeeded = this.getXpForTier(tier + 1);
      if (remainingXp < xpNeeded) {
        break;
      }
      remainingXp -= xpNeeded;
      tier++;
    }

    return { tier, xpInTier: remainingXp };
  }

  // ============================================================================
  // User Battle Pass Operations
  // ============================================================================

  /**
   * Get or create user's battle pass for current season
   */
  async getUserProgress(userId: string): Promise<BattlePassProgress> {
    let bp = await getUserBattlePass(userId, this.currentSeason);

    if (!bp) {
      bp = await createUserBattlePass(userId, this.currentSeason);
    }

    const { tier, xpInTier } = this.getTierFromXp(bp.xp);
    const xpForNextTier = this.getXpForTier(tier + 1);
    const progressPercent = xpForNextTier > 0 ? Math.round((xpInTier / xpForNextTier) * 100) : 100;

    // Count unclaimed rewards
    const rewards = await getBattlePassRewards(this.currentSeason);
    const claimedFree = bp.claimedFreeTiers || [];
    const claimedPremium = bp.claimedPremiumTiers || [];

    let unclaimedFree = 0;
    let unclaimedPremium = 0;

    for (const reward of rewards) {
      if (reward.tier <= tier) {
        if (!reward.isPremium && !claimedFree.includes(reward.tier)) {
          unclaimedFree++;
        }
        if (reward.isPremium && bp.isPremium && !claimedPremium.includes(reward.tier)) {
          unclaimedPremium++;
        }
      }
    }

    return {
      season: this.currentSeason,
      currentTier: tier,
      currentXp: bp.xp,
      xpForCurrentTier: xpInTier,
      xpForNextTier,
      progressPercent,
      isPremium: bp.isPremium,
      purchasedAt: bp.purchasedAt?.toISOString() || null,
      claimedFreeTiers: claimedFree,
      claimedPremiumTiers: claimedPremium,
      unclaimedFreeRewards: unclaimedFree,
      unclaimedPremiumRewards: unclaimedPremium,
      daysRemaining: this.getDaysRemaining(),
    };
  }

  /**
   * Add XP to user's battle pass
   */
  async addXp(userId: string, amount: number, source: string): Promise<TierUpResult> {
    const beforeProgress = await this.getUserProgress(userId);
    const previousTier = beforeProgress.currentTier;

    await addBattlePassXP(userId, this.currentSeason, amount);

    const afterProgress = await this.getUserProgress(userId);
    const newTier = afterProgress.currentTier;
    const tiersGained = newTier - previousTier;

    // Get newly unlocked rewards
    const unlockedRewards: BattlePassReward[] = [];
    if (tiersGained > 0) {
      const rewards = await getBattlePassRewards(this.currentSeason);
      for (const reward of rewards) {
        if (reward.tier > previousTier && reward.tier <= newTier) {
          unlockedRewards.push({
            tier: reward.tier,
            rewardType: reward.rewardType as RewardType,
            rewardId: reward.rewardId,
            rewardAmount: reward.rewardAmount,
            isPremium: reward.isPremium,
          });
        }
      }
    }

    // Log XP gain
    await createTransaction({
      userId,
      type: 'reward',
      itemType: 'battle_pass_xp',
      amount,
      currencyType: 'coins', // Not actually currency, but for logging
      metadata: {
        source,
        season: this.currentSeason,
        previousTier,
        newTier,
      },
    });

    return {
      previousTier,
      newTier,
      tiersGained,
      newXp: afterProgress.currentXp,
      unlockedRewards,
    };
  }

  /**
   * Grant XP for match result
   */
  async grantMatchXp(userId: string, isWinner: boolean, isFirstWinOfDay: boolean = false): Promise<TierUpResult> {
    let xp = isWinner ? XP_SOURCES.WIN_MATCH : XP_SOURCES.LOSE_MATCH;

    if (isWinner && isFirstWinOfDay) {
      xp += XP_SOURCES.FIRST_WIN_OF_DAY;
    }

    return this.addXp(userId, xp, isWinner ? 'match_win' : 'match_loss');
  }

  /**
   * Grant daily login XP
   */
  async grantDailyLoginXp(userId: string): Promise<TierUpResult> {
    return this.addXp(userId, XP_SOURCES.DAILY_LOGIN, 'daily_login');
  }

  /**
   * Grant challenge completion XP
   */
  async grantChallengeXp(userId: string, isWeekly: boolean = false): Promise<TierUpResult> {
    const xp = isWeekly ? XP_SOURCES.WEEKLY_CHALLENGE : XP_SOURCES.DAILY_CHALLENGE;
    return this.addXp(userId, xp, isWeekly ? 'weekly_challenge' : 'daily_challenge');
  }

  // ============================================================================
  // Premium & Purchases
  // ============================================================================

  /**
   * Purchase premium battle pass
   */
  async purchasePremium(userId: string, userGems: number): Promise<{ success: boolean; error?: string }> {
    if (userGems < this.config.premiumPriceGems) {
      return { success: false, error: 'Insufficient gems' };
    }

    const bp = await getUserBattlePass(userId, this.currentSeason);
    if (bp?.isPremium) {
      return { success: false, error: 'Already own premium battle pass' };
    }

    // Deduct gems
    await updateUserCurrency(userId, 0, -this.config.premiumPriceGems);

    // Upgrade to premium
    await upgradeToPremiumBattlePass(userId, this.currentSeason);

    // Log transaction
    await createTransaction({
      userId,
      type: 'purchase',
      itemType: 'battle_pass_premium',
      amount: this.config.premiumPriceGems,
      currencyType: 'gems',
      metadata: { season: this.currentSeason },
    });

    return { success: true };
  }

  /**
   * Skip tiers with gems
   */
  async skipTiers(
    userId: string,
    tiersToSkip: number,
    userGems: number
  ): Promise<{ success: boolean; error?: string; newTier?: number }> {
    const cost = tiersToSkip * this.config.tierSkipPriceGems;

    if (userGems < cost) {
      return { success: false, error: 'Insufficient gems' };
    }

    const progress = await this.getUserProgress(userId);
    const newTier = Math.min(progress.currentTier + tiersToSkip, this.config.totalTiers);
    const actualTiersSkipped = newTier - progress.currentTier;

    if (actualTiersSkipped <= 0) {
      return { success: false, error: 'Already at max tier' };
    }

    // Calculate XP needed to reach new tier
    const xpNeeded = this.getTotalXpForTier(newTier) - progress.currentXp;

    // Deduct gems
    const actualCost = actualTiersSkipped * this.config.tierSkipPriceGems;
    await updateUserCurrency(userId, 0, -actualCost);

    // Add XP
    await addBattlePassXP(userId, this.currentSeason, xpNeeded);

    // Log transaction
    await createTransaction({
      userId,
      type: 'purchase',
      itemType: 'battle_pass_tier_skip',
      amount: actualCost,
      currencyType: 'gems',
      metadata: {
        season: this.currentSeason,
        tiersSkipped: actualTiersSkipped,
        newTier,
      },
    });

    return { success: true, newTier };
  }

  // ============================================================================
  // Reward Claims
  // ============================================================================

  /**
   * Claim a reward from the battle pass
   */
  async claimReward(
    userId: string,
    tier: number,
    isPremium: boolean
  ): Promise<{ success: boolean; error?: string; reward?: BattlePassReward }> {
    // Verify claim is valid
    const claimed = await claimBattlePassReward(userId, this.currentSeason, tier, isPremium);

    if (!claimed) {
      return { success: false, error: 'Cannot claim this reward' };
    }

    // Get reward details
    const rewards = await getBattlePassRewards(this.currentSeason);
    const reward = rewards.find((r) => r.tier === tier && r.isPremium === isPremium);

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    // Grant the reward
    await InventoryService.grantBattlePassReward(
      userId,
      reward.rewardType,
      reward.rewardId,
      reward.rewardAmount,
      tier,
      this.currentSeason,
      isPremium
    );

    return {
      success: true,
      reward: {
        tier: reward.tier,
        rewardType: reward.rewardType as RewardType,
        rewardId: reward.rewardId,
        rewardAmount: reward.rewardAmount,
        isPremium: reward.isPremium,
      },
    };
  }

  /**
   * Claim all available rewards
   */
  async claimAllRewards(userId: string): Promise<{ claimed: BattlePassReward[]; errors: string[] }> {
    const progress = await this.getUserProgress(userId);
    const rewards = await getBattlePassRewards(this.currentSeason);
    const claimed: BattlePassReward[] = [];
    const errors: string[] = [];

    for (const reward of rewards) {
      // Skip if tier not reached
      if (reward.tier > progress.currentTier) continue;

      // Skip premium rewards if not premium
      if (reward.isPremium && !progress.isPremium) continue;

      // Skip already claimed
      if (!reward.isPremium && progress.claimedFreeTiers.includes(reward.tier)) continue;
      if (reward.isPremium && progress.claimedPremiumTiers.includes(reward.tier)) continue;

      const result = await this.claimReward(userId, reward.tier, reward.isPremium);
      if (result.success && result.reward) {
        claimed.push(result.reward);
      } else if (result.error) {
        errors.push(`Tier ${reward.tier}: ${result.error}`);
      }
    }

    return { claimed, errors };
  }

  // ============================================================================
  // Reward Definitions
  // ============================================================================

  /**
   * Get all rewards for the current season
   */
  async getSeasonRewards(): Promise<BattlePassReward[]> {
    const rewards = await getBattlePassRewards(this.currentSeason);
    return rewards.map((r) => ({
      tier: r.tier,
      rewardType: r.rewardType as RewardType,
      rewardId: r.rewardId,
      rewardAmount: r.rewardAmount,
      isPremium: r.isPremium,
    }));
  }

  /**
   * Get configuration
   */
  getConfig(): BattlePassConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const battlePassService = new BattlePassService();
