import type { CharacterId } from '@spike-rivals/shared';

export interface Skin {
  id: string;
  name: string;
  characterId: CharacterId;
  spriteKey: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: { coins?: number; gems?: number };
}

export interface BallSkin {
  id: string;
  name: string;
  spriteKey: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: { coins?: number; gems?: number };
}

const STORAGE_KEY = 'spike-rivals-skins';

export class SkinManager {
  private ownedItems: Set<string> = new Set();
  private equippedItems: Map<string, string> = new Map(); // category -> itemId

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.ownedItems = new Set(data.ownedItems || []);
        this.equippedItems = new Map(Object.entries(data.equippedItems || {}));
      }
    } catch {
      // Start fresh if storage is corrupted
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        ownedItems: Array.from(this.ownedItems),
        equippedItems: Object.fromEntries(this.equippedItems),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage might be full or disabled
    }
  }

  /**
   * Check if player owns an item (generic)
   */
  isOwned(itemId: string): boolean {
    return this.ownedItems.has(itemId) || itemId === 'default';
  }

  /**
   * Add item to owned collection
   */
  addOwned(itemId: string): void {
    this.ownedItems.add(itemId);
    this.saveToStorage();
  }

  /**
   * Check if an item is currently equipped
   */
  isEquipped(itemId: string): boolean {
    for (const equipped of this.equippedItems.values()) {
      if (equipped === itemId) return true;
    }
    return false;
  }

  /**
   * Equip an item (auto-detects category from item ID prefix)
   */
  equip(itemId: string): boolean {
    if (!this.isOwned(itemId)) return false;

    // Determine category from item ID
    const category = this.getCategoryFromItemId(itemId);
    this.equippedItems.set(category, itemId);
    this.saveToStorage();
    return true;
  }

  /**
   * Get equipped item for a category
   */
  getEquipped(category: string): string | undefined {
    return this.equippedItems.get(category);
  }

  /**
   * Infer category from item ID prefix
   */
  private getCategoryFromItemId(itemId: string): string {
    if (itemId.startsWith('ball-')) return 'ball';
    if (itemId.startsWith('net-')) return 'net';
    if (itemId.startsWith('fx-')) return 'fx';
    if (itemId.startsWith('ui-')) return 'ui';
    // Character skins: extract character ID
    const parts = itemId.split('-');
    if (parts.length >= 2) return `skin-${parts[0]}`;
    return 'unknown';
  }

  // ==================== Legacy API (for backwards compatibility) ====================

  ownsSkin(skinId: string): boolean {
    return this.isOwned(skinId);
  }

  unlockSkin(skinId: string): void {
    this.addOwned(skinId);
  }

  equipSkin(characterId: CharacterId, skinId: string): boolean {
    if (!this.isOwned(skinId)) return false;
    this.equippedItems.set(`skin-${characterId}`, skinId);
    this.saveToStorage();
    return true;
  }

  getEquippedSkin(characterId: CharacterId): string {
    return this.equippedItems.get(`skin-${characterId}`) || 'default';
  }

  ownsBallSkin(skinId: string): boolean {
    return this.isOwned(skinId);
  }

  unlockBallSkin(skinId: string): void {
    this.addOwned(skinId);
  }

  equipBallSkin(skinId: string): boolean {
    if (!this.isOwned(skinId)) return false;
    this.equippedItems.set('ball', skinId);
    this.saveToStorage();
    return true;
  }

  getEquippedBallSkin(): string {
    return this.equippedItems.get('ball') || 'default';
  }

  /**
   * Reset all owned/equipped items (for testing)
   */
  reset(): void {
    this.ownedItems.clear();
    this.equippedItems.clear();
    this.saveToStorage();
  }
}

// Singleton instance
let instance: SkinManager | null = null;

export function getSkinManager(): SkinManager {
  if (!instance) {
    instance = new SkinManager();
  }
  return instance;
}
