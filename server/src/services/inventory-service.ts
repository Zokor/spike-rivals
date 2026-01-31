import {
  addItemToInventory,
  updateUserCurrency,
  userOwnsItem,
  getUserInventory,
  createTransaction,
  getSkinById,
} from '../db/queries';

export interface PurchaseResult {
  transactionId: string;
  itemId: string;
}

export class InventoryService {
  /**
   * Purchase an item from the shop
   * Handles currency deduction, inventory addition, and transaction logging
   */
  static async purchaseItem(
    userId: string,
    itemId: string,
    itemType: string,
    price: number,
    currency: 'coins' | 'gems'
  ): Promise<PurchaseResult> {
    // Create transaction record first
    const transaction = await createTransaction({
      userId,
      type: 'purchase',
      itemType,
      itemId,
      amount: price,
      currencyType: currency,
      metadata: {
        action: 'shop_purchase',
        timestamp: new Date().toISOString(),
      },
    });

    // Deduct currency
    const coinChange = currency === 'coins' ? -price : 0;
    const gemChange = currency === 'gems' ? -price : 0;

    await updateUserCurrency(userId, coinChange, gemChange);

    // Add item to inventory
    await addItemToInventory(userId, itemId);

    return {
      transactionId: transaction.id,
      itemId,
    };
  }

  /**
   * Grant an item to a user without payment
   * Used for rewards, battle pass, etc.
   */
  static async grantItem(
    userId: string,
    itemId: string,
    reason: string = 'reward'
  ): Promise<{ granted: boolean; transactionId?: string }> {
    // Check if user already owns item
    const alreadyOwns = await userOwnsItem(userId, itemId);
    if (alreadyOwns) {
      return { granted: false };
    }

    // Get item details
    const skin = await getSkinById(itemId);
    const itemType = skin?.itemType || 'unknown';

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      type: 'reward',
      itemType,
      itemId,
      amount: 0,
      currencyType: 'coins',
      metadata: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    await addItemToInventory(userId, itemId);

    return {
      granted: true,
      transactionId: transaction.id,
    };
  }

  /**
   * Grant duplicate compensation (coins for duplicate items)
   */
  static async grantDuplicateCompensation(
    userId: string,
    itemId: string,
    rarity: string
  ): Promise<{ coins: number; transactionId: string }> {
    // Duplicate compensation rates based on rarity
    const compensationRates: Record<string, number> = {
      common: 50,
      rare: 150,
      epic: 500,
      legendary: 1000,
    };

    const coins = compensationRates[rarity] || 50;

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      type: 'reward',
      itemType: 'duplicate_compensation',
      itemId,
      amount: coins,
      currencyType: 'coins',
      metadata: {
        reason: 'duplicate_item',
        originalRarity: rarity,
        timestamp: new Date().toISOString(),
      },
    });

    // Grant coins
    await updateUserCurrency(userId, coins, 0);

    return {
      coins,
      transactionId: transaction.id,
    };
  }

  /**
   * Check if user owns an item
   */
  static async checkOwnership(userId: string, itemId: string): Promise<boolean> {
    return userOwnsItem(userId, itemId);
  }

  /**
   * Get user's full inventory grouped by type
   */
  static async getUserInventoryGrouped(userId: string): Promise<Record<string, string[]>> {
    const items = await getUserInventory(userId);

    // Group by type
    const grouped: Record<string, string[]> = {};
    for (const item of items) {
      const type = item.skin?.itemType || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(item.skinId);
    }

    return grouped;
  }

  /**
   * Grant battle pass reward (item or currency)
   */
  static async grantBattlePassReward(
    userId: string,
    rewardType: string,
    rewardId: string | null,
    rewardAmount: number | null,
    tier: number,
    season: number,
    isPremium: boolean
  ): Promise<{ transactionId: string }> {
    const transaction = await createTransaction({
      userId,
      type: 'reward',
      itemType: rewardType,
      itemId: rewardId || undefined,
      amount: rewardAmount || 0,
      currencyType: rewardType === 'gems' ? 'gems' : 'coins',
      metadata: {
        source: 'battle_pass',
        season,
        tier,
        isPremium,
        timestamp: new Date().toISOString(),
      },
    });

    // Handle different reward types
    switch (rewardType) {
      case 'coins':
        await updateUserCurrency(userId, rewardAmount || 0, 0);
        break;
      case 'gems':
        await updateUserCurrency(userId, 0, rewardAmount || 0);
        break;
      case 'skin':
      case 'character_skin':
      case 'ball_skin':
      case 'court':
        if (rewardId) {
          await this.grantItem(userId, rewardId, 'battle_pass');
        }
        break;
    }

    return { transactionId: transaction.id };
  }

  /**
   * Grant match rewards
   */
  static async grantMatchReward(
    userId: string,
    coins: number,
    xp: number,
    isWinner: boolean,
    matchId?: string
  ): Promise<{ transactionId: string }> {
    const transaction = await createTransaction({
      userId,
      type: 'match_reward',
      itemType: 'match',
      itemId: matchId,
      amount: coins,
      currencyType: 'coins',
      metadata: {
        xpGranted: xp,
        isWinner,
        timestamp: new Date().toISOString(),
      },
    });

    await updateUserCurrency(userId, coins, 0);

    return { transactionId: transaction.id };
  }

  /**
   * Grant daily login bonus
   */
  static async grantDailyBonus(
    userId: string,
    coins: number,
    consecutiveDays: number
  ): Promise<{ transactionId: string }> {
    const transaction = await createTransaction({
      userId,
      type: 'daily_bonus',
      itemType: 'daily_login',
      amount: coins,
      currencyType: 'coins',
      metadata: {
        consecutiveDays,
        timestamp: new Date().toISOString(),
      },
    });

    await updateUserCurrency(userId, coins, 0);

    return { transactionId: transaction.id };
  }

  /**
   * Process a refund
   */
  static async processRefund(
    userId: string,
    originalTransactionId: string,
    amount: number,
    currencyType: 'coins' | 'gems',
    reason: string
  ): Promise<{ transactionId: string }> {
    const transaction = await createTransaction({
      userId,
      type: 'refund',
      itemType: 'refund',
      amount,
      currencyType,
      metadata: {
        originalTransactionId,
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    const coinChange = currencyType === 'coins' ? amount : 0;
    const gemChange = currencyType === 'gems' ? amount : 0;

    await updateUserCurrency(userId, coinChange, gemChange);

    return { transactionId: transaction.id };
  }
}
