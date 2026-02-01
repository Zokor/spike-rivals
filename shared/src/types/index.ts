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
  isGrounded?: boolean;
  score: number;
  animation?: string;
  connected?: boolean;
  username?: string;
  odUserId?: string;
  speed?: number;
  jump?: number;
  power?: number;
  control?: number;
}

export interface BallState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  lastHitBy: string | null;
  spin?: number;
}

export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'point_scored' | 'paused' | 'finished';

export interface GameState {
  players: Map<string, PlayerState>;
  ball: BallState;
  score?: { player1: number; player2: number };
  status?: GameStatus;
  timer?: number;
  matchTime?: number;
  servingSide: 'left' | 'right';
  winner: string | null;
  winnerSide?: 'left' | 'right' | null;
  roomId?: string;
  createdAt?: number;
  startedAt?: number;
  seed?: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed?: boolean;
  timestamp?: number;
  sequence?: number;
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
