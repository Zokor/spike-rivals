// Re-export character types and class
export {
  type CharacterId,
  type CharacterStats,
  type CharacterInfo,
  Character,
  CHARACTER_INFO,
  getCharacterInfo,
  validateCharacterBalance,
} from './character.js';

export type RankTier = 'ROOKIE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHAMPION';

export type GameMode = 'cpu' | 'quick' | 'ranked' | 'private';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  characterId: CharacterId;
  side: 'left' | 'right';
  isJumping: boolean;
  score: number;
}

export interface BallState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  lastHitBy: string | null;
}

export interface GameState {
  players: Map<string, PlayerState>;
  ball: BallState;
  phase: 'waiting' | 'countdown' | 'playing' | 'scored' | 'ended';
  servingSide: 'left' | 'right';
  winner: string | null;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  timestamp: number;
}

export interface MatchResult {
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  mode: GameMode;
  duration: number;
}

export interface UserProfile {
  id: string;
  username: string;
  elo: number;
  tier: RankTier;
  coins: number;
  gems: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  selectedCharacter: CharacterId;
  ownedSkins: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'character_skin' | 'ball_skin' | 'court_theme' | 'victory_animation';
  rarity: Rarity;
  characterId?: CharacterId;
  priceCoins: number | null;
  priceGems: number;
}

export interface AuthPayload {
  userId: string;
  username: string;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
