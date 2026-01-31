export const PHYSICS = {
  GRAVITY: 800,
  BALL_BOUNCE: 0.8,
  BALL_RADIUS: 8,
  MAX_BALL_SPEED: 600,
  PLAYER_WIDTH: 24,
  PLAYER_HEIGHT: 32,
  NET_HEIGHT: 80,
  NET_WIDTH: 6,              // Visual width (art asset)
  NET_COLLISION_WIDTH: 8,    // Collision width (slightly wider for fair gameplay)
  COURT_WIDTH: 480,
  COURT_HEIGHT: 270,
  GROUND_Y: 230,
} as const;

export const GAME = {
  TARGET_FPS: 60,
  TICK_RATE: 20,
  CASUAL_POINTS: 15,
  RANKED_POINTS: 21,
  SERVE_DELAY_MS: 1500,
} as const;

// Safe margins for UI elements (prevents cropping on ENVELOP mode / notched devices)
export const UI_SAFE = {
  TOP: 12,
  BOTTOM: 16,
  LEFT: 12,
  RIGHT: 12,
} as const;

export const RANKING = {
  STARTING_ELO: 1000,
  K_FACTOR: 32,
  K_FACTOR_NEW_PLAYER: 64,
  NEW_PLAYER_GAMES: 10,
  TIERS: {
    ROOKIE: { min: 0, max: 399 },
    BRONZE: { min: 400, max: 799 },
    SILVER: { min: 800, max: 1199 },
    GOLD: { min: 1200, max: 1599 },
    PLATINUM: { min: 1600, max: 1999 },
    DIAMOND: { min: 2000, max: 2399 },
    CHAMPION: { min: 2400, max: Infinity },
  },
} as const;

export const CHARACTERS = {
  BLITZ: { id: 'blitz', speed: 7, jump: 5, power: 4, control: 4 },
  CRUSHER: { id: 'crusher', speed: 3, jump: 4, power: 8, control: 5 },
  SKY: { id: 'sky', speed: 4, jump: 8, power: 4, control: 4 },
  ZEN: { id: 'zen', speed: 5, jump: 4, power: 3, control: 8 },
  TANK: { id: 'tank', speed: 4, jump: 3, power: 6, control: 7 },
  FLASH: { id: 'flash', speed: 8, jump: 4, power: 3, control: 5 },
  NOVA: { id: 'nova', speed: 5, jump: 6, power: 5, control: 4 },
  GHOST: { id: 'ghost', speed: 6, jump: 5, power: 4, control: 5 },
} as const;

export const ATTRIBUTE_FORMULAS = {
  speed: (value: number) => 100 + value * 20,
  jump: (value: number) => 200 + value * 40,
  power: (value: number) => 300 + value * 50,
  control: (value: number) => 0.5 + value * 0.0625,
} as const;

export const SHOP = {
  RARITY: {
    COMMON: { coins: 500, gems: 50 },
    RARE: { coins: 1500, gems: 150 },
    EPIC: { coins: 5000, gems: 400 },
    LEGENDARY: { coins: null, gems: 800 },
  },
} as const;
