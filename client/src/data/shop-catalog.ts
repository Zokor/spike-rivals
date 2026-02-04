import type { CharacterId } from '@spike-rivals/shared';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'character-skin' | 'ball-skin' | 'net-skin' | 'fx-pack' | 'ui-theme';
export type CurrencyType = 'coins' | 'gems';

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  price: number;
  currency: CurrencyType;
  spriteKey: string;
  characterId?: CharacterId; // Only for character skins
  description?: string;
}

/**
 * Rarity colors for UI
 */
export const RARITY_COLORS: Record<ItemRarity, number> = {
  common: 0x888888,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffaa00,
};

/**
 * Character skins
 */
export const CHARACTER_SKINS: ShopItem[] = [
  // Blitz skins
  {
    id: 'blitz-neon',
    name: 'Neon Blitz',
    type: 'character-skin',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    spriteKey: 'char-blitz-neon',
    characterId: 'blitz',
    description: 'Glowing neon accents',
  },
  {
    id: 'blitz-cyber',
    name: 'Cyber Blitz',
    type: 'character-skin',
    rarity: 'epic',
    price: 1200,
    currency: 'coins',
    spriteKey: 'char-blitz-cyber',
    characterId: 'blitz',
    description: 'Full cybernetic upgrade',
  },
  {
    id: 'blitz-gold',
    name: 'Golden Blitz',
    type: 'character-skin',
    rarity: 'legendary',
    price: 50,
    currency: 'gems',
    spriteKey: 'char-blitz-gold',
    characterId: 'blitz',
    description: 'Pure gold champion skin',
  },

  // Nova skins
  {
    id: 'nova-frost',
    name: 'Frost Nova',
    type: 'character-skin',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    spriteKey: 'char-nova-frost',
    characterId: 'nova',
    description: 'Ice-cold style',
  },
  {
    id: 'nova-flame',
    name: 'Flame Nova',
    type: 'character-skin',
    rarity: 'epic',
    price: 1200,
    currency: 'coins',
    spriteKey: 'char-nova-flame',
    characterId: 'nova',
    description: 'Burning hot look',
  },
];

/**
 * Ball skins
 */
export const BALL_SKINS: ShopItem[] = [
  {
    id: 'ball-plasma',
    name: 'Plasma Ball',
    type: 'ball-skin',
    rarity: 'common',
    price: 200,
    currency: 'coins',
    spriteKey: 'ball-plasma',
    description: 'Crackling energy ball',
  },
  {
    id: 'ball-neon',
    name: 'Neon Ball',
    type: 'ball-skin',
    rarity: 'common',
    price: 250,
    currency: 'coins',
    spriteKey: 'ball-neon',
    description: 'Electric neon glow',
  },
  {
    id: 'ball-fire',
    name: 'Fire Ball',
    type: 'ball-skin',
    rarity: 'rare',
    price: 400,
    currency: 'coins',
    spriteKey: 'ball-fire',
    description: 'Blazing hot volleyball',
  },
  {
    id: 'ball-pixel',
    name: 'Pixel Ball',
    type: 'ball-skin',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    spriteKey: 'ball-pixel',
    description: 'Chunky retro pixels',
  },
  {
    id: 'ball-ice',
    name: 'Ice Ball',
    type: 'ball-skin',
    rarity: 'rare',
    price: 400,
    currency: 'coins',
    spriteKey: 'ball-ice',
    description: 'Frozen crystal ball',
  },
  {
    id: 'ball-void',
    name: 'Void Ball',
    type: 'ball-skin',
    rarity: 'epic',
    price: 800,
    currency: 'coins',
    spriteKey: 'ball-void',
    description: 'Dark matter orb',
  },
  {
    id: 'ball-glitch',
    name: 'Glitch Ball',
    type: 'ball-skin',
    rarity: 'epic',
    price: 900,
    currency: 'coins',
    spriteKey: 'ball-glitch',
    description: 'Fragmented signal artifact',
  },
  {
    id: 'ball-rainbow',
    name: 'Rainbow Ball',
    type: 'ball-skin',
    rarity: 'legendary',
    price: 30,
    currency: 'gems',
    spriteKey: 'ball-rainbow',
    description: 'Prismatic volleyball',
  },
  {
    id: 'ball-neon',
    name: 'Neon Ball',
    type: 'ball-skin',
    rarity: 'epic',
    price: 700,
    currency: 'coins',
    spriteKey: 'ball-neon',
    description: 'Glowing wireframe ball',
  },
  {
    id: 'ball-pixel',
    name: 'Pixel Ball',
    type: 'ball-skin',
    rarity: 'epic',
    price: 700,
    currency: 'coins',
    spriteKey: 'ball-pixel',
    description: '8-bit retro style',
  },
  {
    id: 'ball-glitch',
    name: 'Glitch Ball',
    type: 'ball-skin',
    rarity: 'legendary',
    price: 40,
    currency: 'gems',
    spriteKey: 'ball-glitch',
    description: 'Corrupted digital orb',
  },
];

/**
 * Net skins
 */
export const NET_SKINS: ShopItem[] = [
  {
    id: 'net-neon',
    name: 'Neon Net',
    type: 'net-skin',
    rarity: 'common',
    price: 150,
    currency: 'coins',
    spriteKey: 'net-neon',
    description: 'Glowing neon strands',
  },
  {
    id: 'net-hologram',
    name: 'Hologram Net',
    type: 'net-skin',
    rarity: 'rare',
    price: 350,
    currency: 'coins',
    spriteKey: 'net-hologram',
    description: 'Digital holographic projection',
  },
  {
    id: 'net-laser',
    name: 'Laser Net',
    type: 'net-skin',
    rarity: 'epic',
    price: 600,
    currency: 'coins',
    spriteKey: 'net-laser',
    description: 'Deadly laser grid',
  },
];

/**
 * FX packs (hit effects, trails, etc.)
 */
export const FX_PACKS: ShopItem[] = [
  {
    id: 'fx-sparkle',
    name: 'Sparkle FX',
    type: 'fx-pack',
    rarity: 'common',
    price: 250,
    currency: 'coins',
    spriteKey: 'fx-sparkle',
    description: 'Sparkling hit effects',
  },
  {
    id: 'fx-lightning',
    name: 'Lightning FX',
    type: 'fx-pack',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    spriteKey: 'fx-lightning',
    description: 'Electric hit effects',
  },
  {
    id: 'fx-cosmic',
    name: 'Cosmic FX',
    type: 'fx-pack',
    rarity: 'epic',
    price: 25,
    currency: 'gems',
    spriteKey: 'fx-cosmic',
    description: 'Cosmic explosion effects',
  },
];

/**
 * UI themes
 */
export const UI_THEMES: ShopItem[] = [
  {
    id: 'ui-retro',
    name: 'Retro Theme',
    type: 'ui-theme',
    rarity: 'common',
    price: 300,
    currency: 'coins',
    spriteKey: 'ui-retro',
    description: '80s arcade style',
  },
  {
    id: 'ui-minimal',
    name: 'Minimal Theme',
    type: 'ui-theme',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    spriteKey: 'ui-minimal',
    description: 'Clean and simple',
  },
  {
    id: 'ui-neon',
    name: 'Neon Theme',
    type: 'ui-theme',
    rarity: 'epic',
    price: 750,
    currency: 'coins',
    spriteKey: 'ui-neon',
    description: 'Cyberpunk neon glow',
  },
];

/**
 * Get all items by type
 */
export function getItemsByType(type: ItemType): ShopItem[] {
  switch (type) {
    case 'character-skin':
      return CHARACTER_SKINS;
    case 'ball-skin':
      return BALL_SKINS;
    case 'net-skin':
      return NET_SKINS;
    case 'fx-pack':
      return FX_PACKS;
    case 'ui-theme':
      return UI_THEMES;
    default:
      return [];
  }
}

/**
 * Get all shop items
 */
export function getAllItems(): ShopItem[] {
  return [
    ...CHARACTER_SKINS,
    ...BALL_SKINS,
    ...NET_SKINS,
    ...FX_PACKS,
    ...UI_THEMES,
  ];
}

/**
 * Find item by ID
 */
export function getItemById(id: string): ShopItem | undefined {
  return getAllItems().find((item) => item.id === id);
}

/**
 * Get character skins for a specific character
 */
export function getSkinsForCharacter(characterId: CharacterId): ShopItem[] {
  return CHARACTER_SKINS.filter((skin) => skin.characterId === characterId);
}
