import { Schema, MapSchema, type } from '@colyseus/schema';

/**
 * Ball state synchronized to clients
 */
export class BallSchema extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') velocityX: number = 0;
  @type('number') velocityY: number = 0;
  @type('number') spin: number = 0;
  @type('string') lastHitBy: string = '';
}

/**
 * Player state synchronized to clients
 */
export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') odUserId: string = ''; // Database user ID
  @type('string') username: string = 'Player';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') velocityX: number = 0;
  @type('number') velocityY: number = 0;
  @type('string') characterId: string = 'nova';
  @type('string') side: 'left' | 'right' = 'left';
  @type('boolean') isJumping: boolean = false;
  @type('boolean') isGrounded: boolean = true;
  @type('number') score: number = 0;
  @type('boolean') ready: boolean = false;
  @type('boolean') connected: boolean = true;
  @type('string') animation: string = 'idle';

  // Character stats (from shared constants)
  @type('number') speed: number = 5;
  @type('number') jump: number = 5;
  @type('number') power: number = 5;
  @type('number') control: number = 5;

  // Input state (not synced to other clients for security)
  inputLeft: boolean = false;
  inputRight: boolean = false;
  inputJump: boolean = false;
  inputJumpPressed: boolean = false; // Just pressed this frame
  lastInputSequence: number = 0;

  // Hit cooldown
  hitCooldown: number = 0;
  canHit: boolean = true;
}

/**
 * Score state
 */
export class ScoreSchema extends Schema {
  @type('number') player1: number = 0;
  @type('number') player2: number = 0;
}

/**
 * Game status type
 */
export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'point_scored' | 'paused' | 'finished';

/**
 * Game mode type
 */
export type GameMode = 'casual' | 'ranked' | 'private';

/**
 * Main game state synchronized to all clients
 */
export class GameState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type(BallSchema) ball = new BallSchema();
  @type(ScoreSchema) score = new ScoreSchema();

  @type('string') status: GameStatus = 'waiting';
  @type('string') mode: GameMode = 'casual';
  @type('number') timer: number = 0; // Countdown timer or match timer
  @type('number') matchTime: number = 0; // Total match time in seconds
  @type('string') servingSide: 'left' | 'right' = 'left';
  @type('string') winner: string | null = null;
  @type('string') winnerSide: 'left' | 'right' | null = null;

  // Room metadata
  @type('string') roomId: string = '';
  @type('number') createdAt: number = Date.now();
  @type('number') startedAt: number = 0;

  // Reconnection tracking (session ID -> timeout)
  disconnectedPlayers: Map<string, { odUserId: string; timeout: NodeJS.Timeout; side: 'left' | 'right' }> = new Map();
}

/**
 * Input message from client
 */
export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  sequence: number; // For input validation/ordering
}

/**
 * Join options from client
 */
export interface JoinOptions {
  odUserId?: string;
  username?: string;
  characterId?: string;
  token?: string; // JWT for authentication
}

/**
 * Reconnect options
 */
export interface ReconnectOptions {
  sessionId: string;
  odUserId: string;
}
