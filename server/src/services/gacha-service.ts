import {
  getUserById,
  updateUserCurrency,
  createTransaction,
  getActiveSkins,
  userOwnsItem,
} from '../db/queries';
import { InventoryService } from './inventory-service';
import { RedisClient } from './redis-client';

// ============================================================================
// Configuration
// ============================================================================

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BoxType {
  id: string;
  name: string;
  description: string;
  priceCoins: number | null;
  priceGems: number;
  odds: Record<Rarity, number>;
  guaranteedRarity?: Rarity;
}

export const BOX_TYPES: Record<string, BoxType> = {
  standard: {
    id: 'standard',
    name: 'Standard Box',
    description: 'A chance at common to legendary items',
    priceCoins: 300,
    priceGems: 30,
    odds: {
      common: 0.70,    // 70%
      rare: 0.25,      // 25%
      epic: 0.045,     // 4.5%
      legendary: 0.005, // 0.5%
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium Box',
    description: 'Higher chances for rare items',
    priceCoins: null, // Gems only
    priceGems: 100,
    odds: {
      common: 0.40,    // 40%
      rare: 0.40,      // 40%
      epic: 0.17,      // 17%
      legendary: 0.03, // 3%
    },
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary Box',
    description: 'Guaranteed epic or legendary',
    priceCoins: null,
    priceGems: 300,
    odds: {
      common: 0,
      rare: 0,
      epic: 0.80,      // 80%
      legendary: 0.20, // 20%
    },
    guaranteedRarity: 'epic',
  },
};

// Pity system configuration
export const PITY_CONFIG = {
  RARE_GUARANTEE: 10,      // Guarantee rare+ every 10 pulls
  LEGENDARY_GUARANTEE: 100, // Guarantee legendary every 100 pulls
};

// Duplicate compensation rates
export const DUPLICATE_COMPENSATION: Record<Rarity, number> = {
  common: 50,
  rare: 150,
  epic: 500,
  legendary: 1000,
};

// ============================================================================
// Types
// ============================================================================

export interface GachaItem {
  id: string;
  name: string;
  rarity: Rarity;
  itemType: string;
  spriteSheet?: string;
  previewImage?: string;
}

export interface PullResult {
  item: GachaItem;
  isNew: boolean;
  isDuplicate: boolean;
  compensationCoins: number;
  pityCounter: number;
}

export interface MultiPullResult {
  results: PullResult[];
  totalItems: number;
  newItems: number;
  duplicates: number;
  totalCompensation: number;
  pityUsed: boolean;
}

export interface PityStatus {
  pullsSinceRare: number;
  pullsSinceLegendary: number;
  nextRareIn: number;
  nextLegendaryIn: number;
}

// ============================================================================
// GachaService Class
// ============================================================================

export class GachaService {
  // ============================================================================
  // Box Information
  // ============================================================================

  /**
   * Get all available box types
   */
  getBoxTypes(): BoxType[] {
    return Object.values(BOX_TYPES);
  }

  /**
   * Get a specific box type
   */
  getBoxType(boxId: string): BoxType | null {
    return BOX_TYPES[boxId] || null;
  }

  // ============================================================================
  // Pity System
  // ============================================================================

  /**
   * Get user's pity counter from Redis
   */
  async getPityStatus(userId: string): Promise<PityStatus> {
    const data = await RedisClient.get(`pity:${userId}`);

    if (!data) {
      return {
        pullsSinceRare: 0,
        pullsSinceLegendary: 0,
        nextRareIn: PITY_CONFIG.RARE_GUARANTEE,
        nextLegendaryIn: PITY_CONFIG.LEGENDARY_GUARANTEE,
      };
    }

    const pity = JSON.parse(data);
    return {
      pullsSinceRare: pity.rare || 0,
      pullsSinceLegendary: pity.legendary || 0,
      nextRareIn: PITY_CONFIG.RARE_GUARANTEE - (pity.rare || 0),
      nextLegendaryIn: PITY_CONFIG.LEGENDARY_GUARANTEE - (pity.legendary || 0),
    };
  }

  /**
   * Update pity counter
   */
  private async updatePity(userId: string, gotRare: boolean, gotLegendary: boolean): Promise<void> {
    const current = await this.getPityStatus(userId);

    const newPity = {
      rare: gotRare ? 0 : current.pullsSinceRare + 1,
      legendary: gotLegendary ? 0 : current.pullsSinceLegendary + 1,
    };

    // Store with no expiry (persists forever)
    await RedisClient.set(`pity:${userId}`, JSON.stringify(newPity));
  }

  // ============================================================================
  // Item Pool
  // ============================================================================

  /**
   * Get items available for a rarity
   */
  private async getItemPool(rarity: Rarity): Promise<GachaItem[]> {
    const skins = await getActiveSkins({ rarity });

    return skins.map((skin) => ({
      id: skin.id,
      name: skin.name,
      rarity: skin.rarity as Rarity,
      itemType: skin.itemType,
      spriteSheet: skin.spriteSheet || undefined,
      previewImage: skin.previewImage || undefined,
    }));
  }

  /**
   * Select a random item from a rarity pool
   */
  private async selectRandomItem(rarity: Rarity): Promise<GachaItem | null> {
    const pool = await this.getItemPool(rarity);
    if (pool.length === 0) return null;

    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  // ============================================================================
  // Pull Logic
  // ============================================================================

  /**
   * Determine rarity based on odds and pity
   */
  private async determineRarity(
    boxType: BoxType,
    pityStatus: PityStatus
  ): Promise<Rarity> {
    // Check pity guarantees first
    if (pityStatus.pullsSinceLegendary >= PITY_CONFIG.LEGENDARY_GUARANTEE - 1) {
      return 'legendary';
    }
    if (pityStatus.pullsSinceRare >= PITY_CONFIG.RARE_GUARANTEE - 1) {
      // Guarantee at least rare
      const roll = Math.random();
      const legendaryChance = boxType.odds.legendary / (boxType.odds.rare + boxType.odds.epic + boxType.odds.legendary);
      const epicChance = boxType.odds.epic / (boxType.odds.rare + boxType.odds.epic + boxType.odds.legendary);

      if (roll < legendaryChance) return 'legendary';
      if (roll < legendaryChance + epicChance) return 'epic';
      return 'rare';
    }

    // Normal roll
    const roll = Math.random();
    let cumulative = 0;

    for (const [rarity, chance] of Object.entries(boxType.odds)) {
      cumulative += chance;
      if (roll < cumulative) {
        return rarity as Rarity;
      }
    }

    // Fallback (should never happen if odds sum to 1)
    return 'common';
  }

  /**
   * Perform a single pull
   */
  async pull(userId: string, boxId: string): Promise<{ success: boolean; result?: PullResult; error?: string }> {
    const box = this.getBoxType(boxId);
    if (!box) {
      return { success: false, error: 'Invalid box type' };
    }

    // Check user balance
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Determine currency and check balance
    const useCoins = box.priceCoins !== null && user.coins >= box.priceCoins;
    const useGems = user.gems >= box.priceGems;

    if (!useCoins && !useGems) {
      return { success: false, error: 'Insufficient currency' };
    }

    // Deduct currency
    if (useCoins && box.priceCoins !== null) {
      await updateUserCurrency(userId, -box.priceCoins, 0);
    } else {
      await updateUserCurrency(userId, 0, -box.priceGems);
    }

    // Get pity status
    const pityStatus = await this.getPityStatus(userId);

    // Determine rarity
    const rarity = await this.determineRarity(box, pityStatus);

    // Select item
    const item = await this.selectRandomItem(rarity);
    if (!item) {
      // Refund if no items available (shouldn't happen in production)
      if (useCoins && box.priceCoins !== null) {
        await updateUserCurrency(userId, box.priceCoins, 0);
      } else {
        await updateUserCurrency(userId, 0, box.priceGems);
      }
      return { success: false, error: 'No items available for this rarity' };
    }

    // Check if user already owns item
    const alreadyOwns = await userOwnsItem(userId, item.id);
    let compensationCoins = 0;

    if (alreadyOwns) {
      // Grant duplicate compensation
      compensationCoins = DUPLICATE_COMPENSATION[rarity];
      await updateUserCurrency(userId, compensationCoins, 0);
    } else {
      // Grant item
      await InventoryService.grantItem(userId, item.id, 'gacha_pull');
    }

    // Update pity counter
    const isRareOrBetter = rarity !== 'common';
    const isLegendary = rarity === 'legendary';
    await this.updatePity(userId, isRareOrBetter, isLegendary);

    // Log transaction
    await createTransaction({
      userId,
      type: 'purchase',
      itemType: 'gacha_pull',
      itemId: item.id,
      amount: useCoins && box.priceCoins !== null ? box.priceCoins : box.priceGems,
      currencyType: useCoins ? 'coins' : 'gems',
      metadata: {
        boxId,
        rarity,
        isDuplicate: alreadyOwns,
        compensation: compensationCoins,
        timestamp: new Date().toISOString(),
      },
    });

    const newPityStatus = await this.getPityStatus(userId);

    return {
      success: true,
      result: {
        item,
        isNew: !alreadyOwns,
        isDuplicate: alreadyOwns,
        compensationCoins,
        pityCounter: newPityStatus.pullsSinceLegendary,
      },
    };
  }

  /**
   * Perform multiple pulls (with discount)
   */
  async multiPull(
    userId: string,
    boxId: string,
    count: number = 10
  ): Promise<{ success: boolean; result?: MultiPullResult; error?: string }> {
    const box = this.getBoxType(boxId);
    if (!box) {
      return { success: false, error: 'Invalid box type' };
    }

    // Calculate total cost (10-pull gets 1 free)
    const effectivePulls = count;
    const paidPulls = count >= 10 ? Math.floor(count * 0.9) : count; // 10% discount on 10+

    const coinCost = box.priceCoins !== null ? box.priceCoins * paidPulls : null;
    const gemCost = box.priceGems * paidPulls;

    // Check balance
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const useCoins = coinCost !== null && user.coins >= coinCost;
    const useGems = user.gems >= gemCost;

    if (!useCoins && !useGems) {
      return { success: false, error: 'Insufficient currency' };
    }

    // Deduct currency
    if (useCoins && coinCost !== null) {
      await updateUserCurrency(userId, -coinCost, 0);
    } else {
      await updateUserCurrency(userId, 0, -gemCost);
    }

    // Perform pulls
    const results: PullResult[] = [];
    let pityUsed = false;

    for (let i = 0; i < effectivePulls; i++) {
      const pityStatus = await this.getPityStatus(userId);

      // Check if pity will be used
      if (
        pityStatus.pullsSinceLegendary >= PITY_CONFIG.LEGENDARY_GUARANTEE - 1 ||
        pityStatus.pullsSinceRare >= PITY_CONFIG.RARE_GUARANTEE - 1
      ) {
        pityUsed = true;
      }

      const rarity = await this.determineRarity(box, pityStatus);
      const item = await this.selectRandomItem(rarity);

      if (!item) continue;

      const alreadyOwns = await userOwnsItem(userId, item.id);
      let compensationCoins = 0;

      if (alreadyOwns) {
        compensationCoins = DUPLICATE_COMPENSATION[rarity];
        await updateUserCurrency(userId, compensationCoins, 0);
      } else {
        await InventoryService.grantItem(userId, item.id, 'gacha_multi_pull');
      }

      const isRareOrBetter = rarity !== 'common';
      const isLegendary = rarity === 'legendary';
      await this.updatePity(userId, isRareOrBetter, isLegendary);

      const newPityStatus = await this.getPityStatus(userId);

      results.push({
        item,
        isNew: !alreadyOwns,
        isDuplicate: alreadyOwns,
        compensationCoins,
        pityCounter: newPityStatus.pullsSinceLegendary,
      });
    }

    // Log multi-pull transaction
    await createTransaction({
      userId,
      type: 'purchase',
      itemType: 'gacha_multi_pull',
      amount: useCoins && coinCost !== null ? coinCost : gemCost,
      currencyType: useCoins ? 'coins' : 'gems',
      metadata: {
        boxId,
        pullCount: effectivePulls,
        newItems: results.filter((r) => r.isNew).length,
        duplicates: results.filter((r) => r.isDuplicate).length,
        totalCompensation: results.reduce((sum, r) => sum + r.compensationCoins, 0),
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      result: {
        results,
        totalItems: results.length,
        newItems: results.filter((r) => r.isNew).length,
        duplicates: results.filter((r) => r.isDuplicate).length,
        totalCompensation: results.reduce((sum, r) => sum + r.compensationCoins, 0),
        pityUsed,
      },
    };
  }

  // ============================================================================
  // Display Helpers
  // ============================================================================

  /**
   * Get odds display for a box
   */
  getOddsDisplay(boxId: string): { rarity: string; percentage: string }[] {
    const box = this.getBoxType(boxId);
    if (!box) return [];

    return Object.entries(box.odds)
      .filter(([_, chance]) => chance > 0)
      .map(([rarity, chance]) => ({
        rarity,
        percentage: `${(chance * 100).toFixed(1)}%`,
      }));
  }

  /**
   * Get legal disclaimer (important for regions with loot box regulations)
   */
  getLegalDisclaimer(): string {
    return `
      This feature contains randomized virtual items.
      Odds are displayed before purchase.
      Pity system guarantees: Rare+ every ${PITY_CONFIG.RARE_GUARANTEE} pulls,
      Legendary every ${PITY_CONFIG.LEGENDARY_GUARANTEE} pulls.
      Virtual items have no real-world value and cannot be traded or sold.
    `.trim();
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const gachaService = new GachaService();
