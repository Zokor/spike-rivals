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

export class SkinManager {
  private ownedSkins: Set<string> = new Set();
  private ownedBallSkins: Set<string> = new Set();
  private equippedSkins: Map<CharacterId, string> = new Map();
  private equippedBallSkin: string = 'default';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('spike-rivals-skins');
      if (saved) {
        const data = JSON.parse(saved);
        this.ownedSkins = new Set(data.ownedSkins || []);
        this.ownedBallSkins = new Set(data.ownedBallSkins || []);
        this.equippedSkins = new Map(Object.entries(data.equippedSkins || {}));
        this.equippedBallSkin = data.equippedBallSkin || 'default';
      }
    } catch {
      // Start fresh if storage is corrupted
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        ownedSkins: Array.from(this.ownedSkins),
        ownedBallSkins: Array.from(this.ownedBallSkins),
        equippedSkins: Object.fromEntries(this.equippedSkins),
        equippedBallSkin: this.equippedBallSkin,
      };
      localStorage.setItem('spike-rivals-skins', JSON.stringify(data));
    } catch {
      // Storage might be full or disabled
    }
  }

  ownsSkin(skinId: string): boolean {
    return this.ownedSkins.has(skinId) || skinId === 'default';
  }

  unlockSkin(skinId: string): void {
    this.ownedSkins.add(skinId);
    this.saveToStorage();
  }

  equipSkin(characterId: CharacterId, skinId: string): boolean {
    if (!this.ownsSkin(skinId)) return false;
    this.equippedSkins.set(characterId, skinId);
    this.saveToStorage();
    return true;
  }

  getEquippedSkin(characterId: CharacterId): string {
    return this.equippedSkins.get(characterId) || 'default';
  }

  ownsBallSkin(skinId: string): boolean {
    return this.ownedBallSkins.has(skinId) || skinId === 'default';
  }

  unlockBallSkin(skinId: string): void {
    this.ownedBallSkins.add(skinId);
    this.saveToStorage();
  }

  equipBallSkin(skinId: string): boolean {
    if (!this.ownsBallSkin(skinId)) return false;
    this.equippedBallSkin = skinId;
    this.saveToStorage();
    return true;
  }

  getEquippedBallSkin(): string {
    return this.equippedBallSkin;
  }
}
