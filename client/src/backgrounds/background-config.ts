export type BackgroundId =
  | 'neon-district'
  | 'cyber-arena'
  | 'night-market'
  | 'sunset-beach'
  | 'retro-arcade'
  | 'space-station'
  | 'ancient-temple'
  | 'urban-rooftop';

export interface ParallaxLayer {
  key: string;
  depth: number;
  scrollFactor: number; // 0 = static, 1 = moves with camera
  y?: number;
  alpha?: number;
  tint?: number;
}

export interface AnimatedElement {
  type: 'sprite' | 'particles' | 'tween';
  key?: string;
  config: Record<string, unknown>;
}

export interface BackgroundConfig {
  id: BackgroundId;
  name: string;
  theme: string;
  description: string;
  colors: {
    sky: number;
    ground: number;
    accent: number;
    ambient: number;
  };
  layers: ParallaxLayer[];
  particles?: {
    type: 'rain' | 'dust' | 'sparkles' | 'steam' | 'fireflies' | 'snow';
    config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
  }[];
  animatedElements?: AnimatedElement[];
}

export const BACKGROUND_CONFIGS: Record<BackgroundId, BackgroundConfig> = {
  'neon-district': {
    id: 'neon-district',
    name: 'Neon District',
    theme: 'Cyberpunk',
    description: 'Rooftop court with neon signs, rain, flying cars',
    colors: {
      sky: 0x0d0221,
      ground: 0x1a1a2e,
      accent: 0xff006e,
      ambient: 0x00f5d4,
    },
    layers: [
      { key: 'neon-sky', depth: 0, scrollFactor: 0 },
      { key: 'neon-buildings-far', depth: 1, scrollFactor: 0.1 },
      { key: 'neon-buildings-mid', depth: 2, scrollFactor: 0.3 },
      { key: 'neon-rooftop', depth: 3, scrollFactor: 0.5 },
      { key: 'neon-ground', depth: 4, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'rain',
        config: {
          x: { min: 0, max: 480 },
          y: 0,
          quantity: 2,
          frequency: 50,
          lifespan: 1000,
          speedY: { min: 200, max: 300 },
          speedX: { min: -20, max: -10 },
          scale: { start: 0.5, end: 0.2 },
          alpha: { start: 0.6, end: 0.2 },
          tint: 0x00f5d4,
        },
      },
    ],
  },

  'cyber-arena': {
    id: 'cyber-arena',
    name: 'Cyber Arena',
    theme: 'Cyberpunk',
    description: 'Indoor holographic stadium, digital crowd',
    colors: {
      sky: 0x000000,
      ground: 0x0a0a1a,
      accent: 0xe94560,
      ambient: 0x00ff9f,
    },
    layers: [
      { key: 'cyber-back', depth: 0, scrollFactor: 0 },
      { key: 'cyber-crowd', depth: 1, scrollFactor: 0.1 },
      { key: 'cyber-structure', depth: 2, scrollFactor: 0.3 },
      { key: 'cyber-ground', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'sparkles',
        config: {
          x: { min: 0, max: 480 },
          y: { min: 0, max: 200 },
          quantity: 1,
          frequency: 200,
          lifespan: 2000,
          speedY: { min: -10, max: 10 },
          speedX: { min: -5, max: 5 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0x00ff9f,
        },
      },
    ],
  },

  'night-market': {
    id: 'night-market',
    name: 'Night Market',
    theme: 'Cyberpunk',
    description: 'Street court surrounded by food stalls',
    colors: {
      sky: 0x1a0a0a,
      ground: 0x2d132c,
      accent: 0xee4540,
      ambient: 0xffd369,
    },
    layers: [
      { key: 'market-sky', depth: 0, scrollFactor: 0 },
      { key: 'market-buildings', depth: 1, scrollFactor: 0.1 },
      { key: 'market-stalls', depth: 2, scrollFactor: 0.4 },
      { key: 'market-ground', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'steam',
        config: {
          x: { min: 50, max: 430 },
          y: 200,
          quantity: 1,
          frequency: 300,
          lifespan: 2000,
          speedY: { min: -30, max: -60 },
          speedX: { min: -5, max: 5 },
          scale: { start: 0.5, end: 1.5 },
          alpha: { start: 0.4, end: 0 },
          tint: 0xffd369,
        },
      },
    ],
  },

  'sunset-beach': {
    id: 'sunset-beach',
    name: 'Sunset Beach',
    theme: 'Classic',
    description: 'Beach volleyball at golden hour',
    colors: {
      sky: 0xff7e5f,
      ground: 0xf4e4ba,
      accent: 0xfeb47b,
      ambient: 0x457b9d,
    },
    layers: [
      { key: 'beach-sky', depth: 0, scrollFactor: 0 },
      { key: 'beach-ocean', depth: 1, scrollFactor: 0.1 },
      { key: 'beach-palms', depth: 2, scrollFactor: 0.3 },
      { key: 'beach-sand', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'sparkles',
        config: {
          x: { min: 0, max: 480 },
          y: { min: 60, max: 100 },
          quantity: 1,
          frequency: 500,
          lifespan: 1000,
          scale: { start: 0.2, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xffffff,
        },
      },
    ],
  },

  'retro-arcade': {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    theme: 'Nostalgic',
    description: 'Inside an 80s arcade',
    colors: {
      sky: 0x1a1a2e,
      ground: 0x2d2d44,
      accent: 0xff006e,
      ambient: 0x00f5d4,
    },
    layers: [
      { key: 'arcade-back', depth: 0, scrollFactor: 0 },
      { key: 'arcade-cabinets', depth: 1, scrollFactor: 0.2 },
      { key: 'arcade-near', depth: 2, scrollFactor: 0.4 },
      { key: 'arcade-ground', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'dust',
        config: {
          x: { min: 0, max: 480 },
          y: { min: 0, max: 270 },
          quantity: 1,
          frequency: 1000,
          lifespan: 5000,
          speedY: { min: -5, max: 5 },
          speedX: { min: -2, max: 2 },
          scale: 0.2,
          alpha: { start: 0.3, end: 0 },
          tint: 0xffffff,
        },
      },
    ],
  },

  'space-station': {
    id: 'space-station',
    name: 'Space Station',
    theme: 'Sci-Fi',
    description: 'Zero-G court in space, Earth visible',
    colors: {
      sky: 0x000000,
      ground: 0x1d3557,
      accent: 0x00f5d4,
      ambient: 0x2ecc71,
    },
    layers: [
      { key: 'space-stars', depth: 0, scrollFactor: 0 },
      { key: 'space-earth', depth: 1, scrollFactor: 0.05 },
      { key: 'space-station', depth: 2, scrollFactor: 0.2 },
      { key: 'space-ground', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'dust',
        config: {
          x: { min: 0, max: 480 },
          y: { min: 0, max: 270 },
          quantity: 1,
          frequency: 500,
          lifespan: 8000,
          speedY: { min: -2, max: 2 },
          speedX: { min: -2, max: 2 },
          scale: 0.15,
          alpha: { start: 0.5, end: 0 },
          tint: 0xffffff,
        },
      },
    ],
  },

  'ancient-temple': {
    id: 'ancient-temple',
    name: 'Ancient Temple',
    theme: 'Fantasy',
    description: 'Mystical ruins, floating stones',
    colors: {
      sky: 0x2c3e50,
      ground: 0x7f8c8d,
      accent: 0x8e44ad,
      ambient: 0x00ff9f,
    },
    layers: [
      { key: 'temple-sky', depth: 0, scrollFactor: 0 },
      { key: 'temple-ruins', depth: 1, scrollFactor: 0.15 },
      { key: 'temple-columns', depth: 2, scrollFactor: 0.35 },
      { key: 'temple-ground', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'fireflies',
        config: {
          x: { min: 0, max: 480 },
          y: { min: 50, max: 220 },
          quantity: 1,
          frequency: 300,
          lifespan: 4000,
          speedY: { min: -20, max: 20 },
          speedX: { min: -20, max: 20 },
          scale: { start: 0.3, end: 0.1 },
          alpha: { start: 0, end: 1 },
          tint: 0x00ff9f,
        },
      },
      {
        type: 'sparkles',
        config: {
          x: { min: 0, max: 480 },
          y: 270,
          quantity: 1,
          frequency: 200,
          lifespan: 3000,
          speedY: { min: -50, max: -80 },
          speedX: { min: -10, max: 10 },
          scale: { start: 0.2, end: 0 },
          alpha: { start: 0.8, end: 0 },
          tint: 0x9b59b6,
        },
      },
    ],
  },

  'urban-rooftop': {
    id: 'urban-rooftop',
    name: 'Urban Rooftop',
    theme: 'Modern',
    description: 'City rooftop at night, skyline',
    colors: {
      sky: 0x1a1a2e,
      ground: 0x16213e,
      accent: 0xff6b35,
      ambient: 0x00ff9f,
    },
    layers: [
      { key: 'urban-sky', depth: 0, scrollFactor: 0 },
      { key: 'urban-skyline', depth: 1, scrollFactor: 0.1 },
      { key: 'urban-rooftop', depth: 2, scrollFactor: 0.4 },
      { key: 'urban-ground', depth: 3, scrollFactor: 1 },
    ],
    particles: [
      {
        type: 'steam',
        config: {
          x: 400,
          y: 180,
          quantity: 1,
          frequency: 400,
          lifespan: 2500,
          speedY: { min: -40, max: -60 },
          speedX: { min: -3, max: 3 },
          scale: { start: 0.3, end: 1 },
          alpha: { start: 0.3, end: 0 },
          tint: 0xaaaaaa,
        },
      },
    ],
  },
};

export function getBackgroundConfig(id: BackgroundId): BackgroundConfig {
  return BACKGROUND_CONFIGS[id];
}

export function getAllBackgrounds(): BackgroundConfig[] {
  return Object.values(BACKGROUND_CONFIGS);
}
