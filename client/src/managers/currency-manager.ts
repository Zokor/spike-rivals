const STORAGE_KEY = 'spike-rivals-currency';

interface CurrencyData {
  coins: number;
  gems: number;
}

/**
 * Manages player currency (coins and gems)
 * Persists to localStorage
 */
export class CurrencyManager {
  private coins: number;
  private gems: number;

  // Match reward amounts
  static readonly WIN_COINS = 30;
  static readonly LOSS_COINS = 15;

  constructor() {
    const data = this.load();
    this.coins = data.coins;
    this.gems = data.gems;
  }

  /**
   * Get current coin balance
   */
  getCoins(): number {
    return this.coins;
  }

  /**
   * Get current gem balance
   */
  getGems(): number {
    return this.gems;
  }

  /**
   * Add coins (e.g., from match rewards)
   */
  addCoins(amount: number): void {
    if (amount <= 0) return;
    this.coins += amount;
    this.save();
  }

  /**
   * Spend coins (returns false if insufficient)
   */
  spendCoins(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.coins < amount) return false;
    this.coins -= amount;
    this.save();
    return true;
  }

  /**
   * Check if player can afford a coin purchase
   */
  canAffordCoins(amount: number): boolean {
    return this.coins >= amount;
  }

  /**
   * Add gems
   */
  addGems(amount: number): void {
    if (amount <= 0) return;
    this.gems += amount;
    this.save();
  }

  /**
   * Spend gems (returns false if insufficient)
   */
  spendGems(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.gems < amount) return false;
    this.gems -= amount;
    this.save();
    return true;
  }

  /**
   * Check if player can afford a gem purchase
   */
  canAffordGems(amount: number): boolean {
    return this.gems >= amount;
  }

  /**
   * Award match completion rewards
   */
  awardMatchReward(won: boolean): number {
    const reward = won ? CurrencyManager.WIN_COINS : CurrencyManager.LOSS_COINS;
    this.addCoins(reward);
    return reward;
  }

  /**
   * Load from localStorage
   */
  private load(): CurrencyData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as CurrencyData;
        return {
          coins: data.coins ?? 0,
          gems: data.gems ?? 0,
        };
      }
    } catch {
      // Ignore parse errors
    }
    // Default starting currency
    return { coins: 100, gems: 10 };
  }

  /**
   * Save to localStorage
   */
  private save(): void {
    try {
      const data: CurrencyData = {
        coins: this.coins,
        gems: this.gems,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Reset currency (for testing)
   */
  reset(): void {
    this.coins = 100;
    this.gems = 10;
    this.save();
  }
}

// Singleton instance
let instance: CurrencyManager | null = null;

export function getCurrencyManager(): CurrencyManager {
  if (!instance) {
    instance = new CurrencyManager();
  }
  return instance;
}
