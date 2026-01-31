import {
  getUserById,
  updateUserCurrency,
  createTransaction,
} from '../db/queries';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Coin earning rates (soft currency)
 */
export const COIN_EARNINGS = {
  MATCH_WIN: 30,
  MATCH_LOSE: 10,
  DAILY_BONUS_BASE: 50,
  DAILY_BONUS_STREAK_MULTIPLIER: 10, // +10 per consecutive day
  DAILY_BONUS_MAX: 200,
  CHALLENGE_DAILY: 100,
  CHALLENGE_WEEKLY: 500,
  FIRST_WIN_BONUS: 25,
} as const;

/**
 * Gem packages (premium currency)
 */
export interface GemPackage {
  id: string;
  gems: number;
  bonusGems: number;
  priceUsd: number;
  bonusPercent: number;
  popular?: boolean;
  bestValue?: boolean;
}

export const GEM_PACKAGES: GemPackage[] = [
  { id: 'gems_100', gems: 100, bonusGems: 0, priceUsd: 0.99, bonusPercent: 0 },
  { id: 'gems_550', gems: 500, bonusGems: 50, priceUsd: 4.99, bonusPercent: 10 },
  { id: 'gems_1200', gems: 1000, bonusGems: 200, priceUsd: 9.99, bonusPercent: 20, popular: true },
  { id: 'gems_2600', gems: 2000, bonusGems: 600, priceUsd: 19.99, bonusPercent: 30 },
  { id: 'gems_7000', gems: 5000, bonusGems: 2000, priceUsd: 49.99, bonusPercent: 40, bestValue: true },
];

/**
 * Item pricing tiers
 */
export const ITEM_PRICING = {
  COMMON: { coins: 500, gems: 50 },
  RARE: { coins: 1500, gems: 150 },
  EPIC: { coins: 5000, gems: 400 },
  LEGENDARY: { coins: null, gems: 800 }, // Gems only
  BATTLE_PASS: { coins: null, gems: 500 },
} as const;

// ============================================================================
// Types
// ============================================================================

export interface UserBalance {
  coins: number;
  gems: number;
}

export interface CurrencyTransaction {
  type: 'earn' | 'spend' | 'purchase' | 'refund';
  currency: 'coins' | 'gems';
  amount: number;
  reason: string;
  timestamp: Date;
}

export interface DailyBonusResult {
  coins: number;
  consecutiveDays: number;
  nextBonusAt: Date;
}

// ============================================================================
// CurrencyService Class
// ============================================================================

export class CurrencyService {
  // ============================================================================
  // Balance Operations
  // ============================================================================

  /**
   * Get user's current balance
   */
  async getBalance(userId: string): Promise<UserBalance | null> {
    const user = await getUserById(userId);
    if (!user) return null;

    return {
      coins: user.coins,
      gems: user.gems,
    };
  }

  /**
   * Check if user can afford an amount
   */
  async canAfford(userId: string, currency: 'coins' | 'gems', amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    if (!balance) return false;

    return currency === 'coins' ? balance.coins >= amount : balance.gems >= amount;
  }

  /**
   * Add coins to user account
   */
  async addCoins(userId: string, amount: number, reason: string): Promise<{ newBalance: number; transactionId: string }> {
    const transaction = await createTransaction({
      userId,
      type: 'reward',
      itemType: 'currency',
      amount,
      currencyType: 'coins',
      metadata: { reason, timestamp: new Date().toISOString() },
    });

    await updateUserCurrency(userId, amount, 0);
    const balance = await this.getBalance(userId);

    return {
      newBalance: balance?.coins ?? 0,
      transactionId: transaction.id,
    };
  }

  /**
   * Add gems to user account
   */
  async addGems(userId: string, amount: number, reason: string): Promise<{ newBalance: number; transactionId: string }> {
    const transaction = await createTransaction({
      userId,
      type: 'reward',
      itemType: 'currency',
      amount,
      currencyType: 'gems',
      metadata: { reason, timestamp: new Date().toISOString() },
    });

    await updateUserCurrency(userId, 0, amount);
    const balance = await this.getBalance(userId);

    return {
      newBalance: balance?.gems ?? 0,
      transactionId: transaction.id,
    };
  }

  /**
   * Spend currency
   */
  async spend(
    userId: string,
    currency: 'coins' | 'gems',
    amount: number,
    reason: string,
    itemId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    const canPay = await this.canAfford(userId, currency, amount);
    if (!canPay) {
      return { success: false, error: `Insufficient ${currency}` };
    }

    await createTransaction({
      userId,
      type: 'purchase',
      itemType: 'spending',
      itemId,
      amount,
      currencyType: currency,
      metadata: { reason, timestamp: new Date().toISOString() },
    });

    const coinChange = currency === 'coins' ? -amount : 0;
    const gemChange = currency === 'gems' ? -amount : 0;

    await updateUserCurrency(userId, coinChange, gemChange);
    const balance = await this.getBalance(userId);

    return {
      success: true,
      newBalance: currency === 'coins' ? balance?.coins : balance?.gems,
    };
  }

  // ============================================================================
  // Earning Operations
  // ============================================================================

  /**
   * Grant match rewards
   */
  async grantMatchReward(userId: string, isWinner: boolean): Promise<{ coins: number }> {
    const coins = isWinner ? COIN_EARNINGS.MATCH_WIN : COIN_EARNINGS.MATCH_LOSE;
    await this.addCoins(userId, coins, isWinner ? 'match_win' : 'match_loss');
    return { coins };
  }

  /**
   * Grant first win of day bonus
   */
  async grantFirstWinBonus(userId: string): Promise<{ coins: number }> {
    await this.addCoins(userId, COIN_EARNINGS.FIRST_WIN_BONUS, 'first_win_of_day');
    return { coins: COIN_EARNINGS.FIRST_WIN_BONUS };
  }

  /**
   * Grant daily login bonus
   */
  async grantDailyBonus(userId: string, consecutiveDays: number): Promise<DailyBonusResult> {
    // Calculate bonus with streak multiplier
    const streakBonus = Math.min(consecutiveDays - 1, 7) * COIN_EARNINGS.DAILY_BONUS_STREAK_MULTIPLIER;
    const coins = Math.min(
      COIN_EARNINGS.DAILY_BONUS_BASE + streakBonus,
      COIN_EARNINGS.DAILY_BONUS_MAX
    );

    await this.addCoins(userId, coins, 'daily_login_bonus');

    // Calculate next bonus time (next day at midnight UTC)
    const now = new Date();
    const nextBonus = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));

    return {
      coins,
      consecutiveDays,
      nextBonusAt: nextBonus,
    };
  }

  /**
   * Grant challenge reward
   */
  async grantChallengeReward(userId: string, isWeekly: boolean): Promise<{ coins: number }> {
    const coins = isWeekly ? COIN_EARNINGS.CHALLENGE_WEEKLY : COIN_EARNINGS.CHALLENGE_DAILY;
    await this.addCoins(userId, coins, isWeekly ? 'weekly_challenge' : 'daily_challenge');
    return { coins };
  }

  // ============================================================================
  // Premium Currency Operations
  // ============================================================================

  /**
   * Get available gem packages
   */
  getGemPackages(): GemPackage[] {
    return GEM_PACKAGES;
  }

  /**
   * Get a specific gem package
   */
  getGemPackage(packageId: string): GemPackage | null {
    return GEM_PACKAGES.find((p) => p.id === packageId) || null;
  }

  /**
   * Process gem purchase (after payment verification)
   * This should be called ONLY after verifying payment with your payment provider
   */
  async processGemPurchase(
    userId: string,
    packageId: string,
    paymentTransactionId: string
  ): Promise<{ success: boolean; gemsAdded?: number; error?: string }> {
    const gemPackage = this.getGemPackage(packageId);
    if (!gemPackage) {
      return { success: false, error: 'Invalid package' };
    }

    const totalGems = gemPackage.gems + gemPackage.bonusGems;

    await createTransaction({
      userId,
      type: 'purchase',
      itemType: 'gem_package',
      itemId: packageId,
      amount: gemPackage.priceUsd * 100, // Store in cents
      currencyType: 'real',
      metadata: {
        paymentTransactionId,
        gemsBase: gemPackage.gems,
        gemsBonus: gemPackage.bonusGems,
        totalGems,
        timestamp: new Date().toISOString(),
      },
    });

    await updateUserCurrency(userId, 0, totalGems);

    return { success: true, gemsAdded: totalGems };
  }

  // ============================================================================
  // Pricing Helpers
  // ============================================================================

  /**
   * Get item price by rarity
   */
  getItemPrice(rarity: keyof typeof ITEM_PRICING): { coins: number | null; gems: number } {
    return ITEM_PRICING[rarity];
  }

  /**
   * Check if user can afford item
   */
  async canAffordItem(
    userId: string,
    rarity: keyof typeof ITEM_PRICING,
    preferredCurrency: 'coins' | 'gems'
  ): Promise<{ canAfford: boolean; currency: 'coins' | 'gems' | null; price: number | null }> {
    const pricing = this.getItemPrice(rarity);
    const balance = await this.getBalance(userId);

    if (!balance) {
      return { canAfford: false, currency: null, price: null };
    }

    // Try preferred currency first
    if (preferredCurrency === 'coins' && pricing.coins !== null) {
      if (balance.coins >= pricing.coins) {
        return { canAfford: true, currency: 'coins', price: pricing.coins };
      }
    }

    // Try gems
    if (balance.gems >= pricing.gems) {
      return { canAfford: true, currency: 'gems', price: pricing.gems };
    }

    // Try coins as fallback
    if (pricing.coins !== null && balance.coins >= pricing.coins) {
      return { canAfford: true, currency: 'coins', price: pricing.coins };
    }

    return { canAfford: false, currency: null, price: null };
  }

  // ============================================================================
  // Anti-Fraud
  // ============================================================================

  /**
   * Verify transaction integrity (placeholder for anti-fraud measures)
   */
  async verifyTransaction(transactionId: string): Promise<boolean> {
    // TODO: Implement actual verification
    // - Check transaction exists
    // - Verify amounts match
    // - Check for duplicate transactions
    // - Rate limiting
    return true;
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const currencyService = new CurrencyService();
