/**
 * Shared Physics Simulation for Spike Rivals
 *
 * This module provides deterministic physics calculations that run identically
 * on both client and server. All physics use a fixed timestep for consistency.
 *
 * IMPORTANT: This code must remain deterministic!
 * - No Math.random() in core physics (use seeded random for controlled randomness)
 * - Same inputs must always produce same outputs
 * - Fixed-point math considerations for cross-platform consistency
 */

import { PHYSICS, ATTRIBUTE_FORMULAS } from '../constants.js';
import type { Vector2, PlayerState, BallState, CharacterStats, CharacterId } from '../types/index.js';

// ==================== Constants ====================

/** Fixed timestep for physics simulation (1/60 second) */
export const FIXED_TIMESTEP = 1 / 60;

/** Fixed timestep in milliseconds */
export const FIXED_TIMESTEP_MS = 1000 / 60;

/** Hit range for player-ball collision */
const PLAYER_HIT_RANGE = 28;

/** Hit cooldown in frames (at 60fps) */
const HIT_COOLDOWN_FRAMES = 12; // ~200ms

/** Spin decay factor per frame */
const SPIN_DECAY = 0.98;

/** Spin effect on horizontal velocity */
const SPIN_EFFECT = 50;

// ==================== Types ====================

/**
 * Extended ball state with spin for advanced physics
 */
export interface ExtendedBallState extends BallState {
  spin: number;
  hitCooldown: number;
}

/**
 * Extended player state with hit tracking
 */
export interface ExtendedPlayerState extends PlayerState {
  isGrounded: boolean;
  canHit: boolean;
  hitCooldown: number;
  animation: string;
}

/**
 * Player input state
 */
export interface PlayerInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean; // True only on the frame jump was pressed
  action?: boolean; // Action button held (bump/spike)
  actionPressed?: boolean; // True only on the frame action was pressed
}

/**
 * Result of a physics simulation step
 */
export interface SimulationResult {
  ball: ExtendedBallState;
  players: Map<string, ExtendedPlayerState>;
  scoredBy: 'left' | 'right' | null;
  events: SimulationEvent[];
}

/**
 * Events that occurred during simulation
 */
export type SimulationEvent =
  | { type: 'ball_hit'; playerId: string; power: number }
  | { type: 'ball_bounce'; surface: 'wall' | 'ceiling' | 'net' }
  | { type: 'score'; side: 'left' | 'right' }
  | { type: 'player_land'; playerId: string }
  | { type: 'player_jump'; playerId: string };

/**
 * Complete simulation state for serialization
 */
export interface SimulationState {
  ball: ExtendedBallState;
  players: Record<string, ExtendedPlayerState>;
  frame: number;
}

// ==================== Seeded Random ====================

/**
 * Seeded random number generator for deterministic "randomness"
 * Uses mulberry32 algorithm
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Get next random number between 0 and 1
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Get random number in range [-0.5, 0.5]
   */
  nextCentered(): number {
    return this.next() - 0.5;
  }

  /**
   * Set new seed
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }
}

// ==================== Physics Simulation Class ====================

/**
 * Main physics simulation class
 * Handles all game physics in a deterministic manner
 */
export class PhysicsSimulation {
  private ball: ExtendedBallState;
  private players: Map<string, ExtendedPlayerState>;
  private playerStats: Map<string, CharacterStats>;
  private random: SeededRandom;
  private frame: number;
  private events: SimulationEvent[];

  constructor(seed: number = Date.now()) {
    this.ball = this.createDefaultBall();
    this.players = new Map();
    this.playerStats = new Map();
    this.random = new SeededRandom(seed);
    this.frame = 0;
    this.events = [];
  }

  // ==================== Initialization ====================

  /**
   * Create default ball state
   */
  private createDefaultBall(): ExtendedBallState {
    return {
      x: PHYSICS.COURT_WIDTH / 4,
      y: 80,
      velocityX: 0,
      velocityY: 0,
      spin: 0,
      lastHitBy: null,
      hitCooldown: 0,
    };
  }

  /**
   * Add a player to the simulation
   */
  addPlayer(
    id: string,
    side: 'left' | 'right',
    characterId: CharacterId,
    stats: CharacterStats
  ): void {
    const startX = side === 'left' ? 100 : PHYSICS.COURT_WIDTH - 100;

    this.players.set(id, {
      id,
      x: startX,
      y: PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2,
      velocityX: 0,
      velocityY: 0,
      characterId,
      side,
      isJumping: false,
      isGrounded: true,
      canHit: true,
      hitCooldown: 0,
      score: 0,
      animation: 'idle',
    });

    this.playerStats.set(id, stats);
  }

  /**
   * Remove a player from the simulation
   */
  removePlayer(id: string): void {
    this.players.delete(id);
    this.playerStats.delete(id);
  }

  /**
   * Reset ball to serving position
   */
  resetBall(servingSide: 'left' | 'right'): void {
    this.ball = {
      x: servingSide === 'left' ? PHYSICS.COURT_WIDTH / 4 : (PHYSICS.COURT_WIDTH * 3) / 4,
      y: 80,
      velocityX: 0,
      velocityY: 0,
      spin: 0,
      lastHitBy: null,
      hitCooldown: 0,
    };
  }

  /**
   * Reset player to starting position
   */
  resetPlayer(id: string): void {
    const player = this.players.get(id);
    if (!player) return;

    const startX = player.side === 'left' ? 100 : PHYSICS.COURT_WIDTH - 100;

    player.x = startX;
    player.y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isGrounded = true;
    player.isJumping = false;
    player.canHit = true;
    player.hitCooldown = 0;
    player.animation = 'idle';
  }

  /**
   * Reset all players
   */
  resetAllPlayers(): void {
    for (const id of this.players.keys()) {
      this.resetPlayer(id);
    }
  }

  // ==================== Main Simulation Step ====================

  /**
   * Run one physics step (fixed timestep)
   * This is the main simulation function
   */
  step(inputs: Map<string, PlayerInputState>): SimulationResult {
    this.events = [];
    this.frame++;

    const dt = FIXED_TIMESTEP;

    // Update players
    for (const [id, player] of this.players) {
      const input = inputs.get(id) || { left: false, right: false, jump: false, jumpPressed: false };
      const stats = this.playerStats.get(id);
      if (stats) {
        this.updatePlayer(player, input, stats, dt);
      }
    }

    // Update ball
    this.updateBall(dt);

    // Check player-ball collisions
    this.checkCollisions();

    // Check scoring
    const scoredBy = this.checkScoringInternal();

    return {
      ball: { ...this.ball },
      players: new Map(this.players),
      scoredBy,
      events: [...this.events],
    };
  }

  // ==================== Player Physics ====================

  /**
   * Update a single player's physics
   */
  private updatePlayer(
    player: ExtendedPlayerState,
    input: PlayerInputState,
    stats: CharacterStats,
    dt: number
  ): void {
    const moveSpeed = ATTRIBUTE_FORMULAS.speed(stats.speed);
    const jumpForce = ATTRIBUTE_FORMULAS.jump(stats.jump);

    // Horizontal movement
    let velocityX = 0;
    if (input.left) velocityX -= moveSpeed;
    if (input.right) velocityX += moveSpeed;
    player.velocityX = velocityX;

    // Jump (only on press, not hold)
    if (input.jumpPressed && player.isGrounded) {
      player.velocityY = -jumpForce;
      player.isGrounded = false;
      player.isJumping = true;
      player.animation = 'jump';
      this.events.push({ type: 'player_jump', playerId: player.id });
    }

    // Apply gravity
    if (!player.isGrounded) {
      player.velocityY += PHYSICS.GRAVITY * dt;

      // Switch to fall animation
      if (player.velocityY > 0 && player.animation === 'jump') {
        player.animation = 'fall';
      }
    }

    // Update position
    player.x += player.velocityX * dt;
    player.y += player.velocityY * dt;

    // Ground collision
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    if (player.y >= groundY) {
      const wasInAir = !player.isGrounded;
      player.y = groundY;
      player.velocityY = 0;
      player.isGrounded = true;
      player.isJumping = false;

      if (wasInAir) {
        player.animation = 'idle';
        this.events.push({ type: 'player_land', playerId: player.id });
      }
    }

    // Update animation based on movement
    if (player.isGrounded) {
      if (Math.abs(player.velocityX) > 10) {
        player.animation = 'run';
      } else if (player.animation === 'run') {
        player.animation = 'idle';
      }
    }

    // Court boundaries
    this.clampPlayerPosition(player);

    // Update hit cooldown
    if (player.hitCooldown > 0) {
      player.hitCooldown--;
      if (player.hitCooldown <= 0) {
        player.canHit = true;
      }
    }
  }

  /**
   * Clamp player to valid court area
   */
  private clampPlayerPosition(player: ExtendedPlayerState): void {
    const halfWidth = PHYSICS.PLAYER_WIDTH / 2;
    const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
    const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;

    if (player.side === 'left') {
      player.x = Math.max(halfWidth, Math.min(player.x, netLeft - halfWidth));
    } else {
      player.x = Math.max(netRight + halfWidth, Math.min(player.x, PHYSICS.COURT_WIDTH - halfWidth));
    }
  }

  // ==================== Ball Physics ====================

  /**
   * Update ball physics
   */
  private updateBall(dt: number): void {
    // Apply gravity
    this.ball.velocityY += PHYSICS.GRAVITY * dt;

    // Apply spin effect
    if (Math.abs(this.ball.spin) > 0.1) {
      this.ball.velocityX += this.ball.spin * SPIN_EFFECT * dt;
      this.ball.spin *= SPIN_DECAY;
    }

    // Update position
    this.ball.x += this.ball.velocityX * dt;
    this.ball.y += this.ball.velocityY * dt;

    // Update hit cooldown
    if (this.ball.hitCooldown > 0) {
      this.ball.hitCooldown--;
    }

    // Clamp velocity
    this.clampBallVelocity();

    // Wall collisions
    this.checkBallWallCollisions();

    // Net collision
    this.checkBallNetCollision();
  }

  /**
   * Clamp ball velocity to max speed
   */
  private clampBallVelocity(): void {
    const speed = Math.sqrt(
      this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY
    );
    if (speed > PHYSICS.MAX_BALL_SPEED) {
      const scale = PHYSICS.MAX_BALL_SPEED / speed;
      this.ball.velocityX *= scale;
      this.ball.velocityY *= scale;
    }
  }

  /**
   * Check and handle ball-wall collisions
   */
  private checkBallWallCollisions(): void {
    const radius = PHYSICS.BALL_RADIUS;

    // Left wall
    if (this.ball.x <= radius) {
      this.ball.x = radius;
      this.ball.velocityX = Math.abs(this.ball.velocityX) * PHYSICS.BALL_BOUNCE;
      this.ball.spin *= -0.5;
      this.events.push({ type: 'ball_bounce', surface: 'wall' });
    }

    // Right wall
    if (this.ball.x >= PHYSICS.COURT_WIDTH - radius) {
      this.ball.x = PHYSICS.COURT_WIDTH - radius;
      this.ball.velocityX = -Math.abs(this.ball.velocityX) * PHYSICS.BALL_BOUNCE;
      this.ball.spin *= -0.5;
      this.events.push({ type: 'ball_bounce', surface: 'wall' });
    }

    // Ceiling
    if (this.ball.y <= radius) {
      this.ball.y = radius;
      this.ball.velocityY = Math.abs(this.ball.velocityY) * PHYSICS.BALL_BOUNCE;
      this.events.push({ type: 'ball_bounce', surface: 'ceiling' });
    }
  }

  /**
   * Check and handle ball-net collision
   */
  private checkBallNetCollision(): void {
    const radius = PHYSICS.BALL_RADIUS;
    const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
    const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;
    const netTop = PHYSICS.GROUND_Y - PHYSICS.NET_HEIGHT;

    // Only check if ball is at net height
    if (this.ball.y < netTop - radius || this.ball.y > PHYSICS.GROUND_Y) {
      return;
    }

    // Check horizontal collision
    if (this.ball.x + radius > netLeft && this.ball.x - radius < netRight) {
      // Determine which side to bounce to
      if (this.ball.velocityX > 0) {
        this.ball.x = netLeft - radius;
        this.ball.velocityX = -Math.abs(this.ball.velocityX) * PHYSICS.BALL_BOUNCE * 0.8;
      } else {
        this.ball.x = netRight + radius;
        this.ball.velocityX = Math.abs(this.ball.velocityX) * PHYSICS.BALL_BOUNCE * 0.8;
      }

      // Top of net collision
      if (this.ball.y - radius < netTop && this.ball.y > netTop - radius * 2) {
        this.ball.y = netTop - radius;
        this.ball.velocityY = -Math.abs(this.ball.velocityY) * PHYSICS.BALL_BOUNCE * 0.5;
      }

      this.events.push({ type: 'ball_bounce', surface: 'net' });
    }
  }

  // ==================== Collision Detection ====================

  /**
   * Check all player-ball collisions
   */
  private checkCollisions(): void {
    // Skip if ball is in cooldown
    if (this.ball.hitCooldown > 0) return;

    for (const [id, player] of this.players) {
      if (!player.canHit) continue;

      const dx = this.ball.x - player.x;
      const dy = this.ball.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < PLAYER_HIT_RANGE + PHYSICS.BALL_RADIUS) {
        const stats = this.playerStats.get(id);
        if (stats) {
          this.handlePlayerBallHit(player, stats);
          break; // Only one player can hit per frame
        }
      }
    }
  }

  /**
   * Handle player hitting the ball
   */
  private handlePlayerBallHit(player: ExtendedPlayerState, stats: CharacterStats): void {
    const hitPower = ATTRIBUTE_FORMULAS.power(stats.power);
    const controlFactor = ATTRIBUTE_FORMULAS.control(stats.control);

    // Calculate direction from player to ball
    const dx = this.ball.x - player.x;
    const dy = this.ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction
    const dirX = distance > 0 ? dx / distance : 0;
    const dirY = distance > 0 ? dy / distance : -1;

    // Add deterministic "randomness" based on control stat
    // Using seeded random for consistency
    const randomFactor = 1 - controlFactor;
    const randomAngle = this.random.nextCentered() * randomFactor * Math.PI * 0.5;

    // Rotate direction by random angle
    const cos = Math.cos(randomAngle);
    const sin = Math.sin(randomAngle);
    const finalDirX = dirX * cos - dirY * sin;
    const finalDirY = dirX * sin + dirY * cos;

    // Calculate new velocity
    let newVelX = finalDirX * hitPower;
    let newVelY = finalDirY * hitPower;

    // Add player momentum (30% transfer)
    newVelX += player.velocityX * 0.3;
    newVelY += player.velocityY * 0.3;

    // Ensure ball goes upward if hit from below
    if (dy < 0 && newVelY > -100) {
      newVelY = Math.min(newVelY, -200);
    }

    // Calculate spin based on player movement
    const spin = player.velocityX * 0.01 * (1 + randomFactor);

    // Apply hit
    this.ball.velocityX = newVelX;
    this.ball.velocityY = newVelY;
    this.ball.spin = Math.max(-3, Math.min(spin, 3));
    this.ball.lastHitBy = player.id;
    this.ball.hitCooldown = HIT_COOLDOWN_FRAMES;

    // Update player state
    player.canHit = false;
    player.hitCooldown = HIT_COOLDOWN_FRAMES;
    player.animation = 'hit';

    // Emit event
    this.events.push({ type: 'ball_hit', playerId: player.id, power: hitPower });
  }

  // ==================== Scoring ====================

  /**
   * Check if ball has touched the ground (scoring condition)
   */
  private checkScoringInternal(): 'left' | 'right' | null {
    if (this.ball.y >= PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS) {
      const scoringSide: 'left' | 'right' =
        this.ball.x < PHYSICS.COURT_WIDTH / 2 ? 'right' : 'left';

      this.events.push({ type: 'score', side: scoringSide });
      return scoringSide;
    }
    return null;
  }

  // ==================== State Access ====================

  /**
   * Get current ball state
   */
  getBall(): ExtendedBallState {
    return { ...this.ball };
  }

  /**
   * Set ball state (for sync)
   */
  setBall(ball: ExtendedBallState): void {
    this.ball = { ...ball };
  }

  /**
   * Get player state
   */
  getPlayer(id: string): ExtendedPlayerState | undefined {
    const player = this.players.get(id);
    return player ? { ...player } : undefined;
  }

  /**
   * Set player state (for sync)
   */
  setPlayer(id: string, state: Partial<ExtendedPlayerState>): void {
    const player = this.players.get(id);
    if (player) {
      Object.assign(player, state);
    }
  }

  /**
   * Get all players
   */
  getPlayers(): Map<string, ExtendedPlayerState> {
    return new Map(this.players);
  }

  /**
   * Get current frame number
   */
  getFrame(): number {
    return this.frame;
  }

  /**
   * Set frame number (for sync)
   */
  setFrame(frame: number): void {
    this.frame = frame;
  }

  /**
   * Get full simulation state for serialization
   */
  getState(): SimulationState {
    return {
      ball: { ...this.ball },
      players: Object.fromEntries(this.players),
      frame: this.frame,
    };
  }

  /**
   * Load simulation state
   */
  setState(state: SimulationState): void {
    this.ball = { ...state.ball };
    this.players = new Map(Object.entries(state.players));
    this.frame = state.frame;
  }

  /**
   * Set random seed (for deterministic simulation)
   */
  setSeed(seed: number): void {
    this.random.setSeed(seed);
  }
}

// ==================== Standalone Functions (for compatibility) ====================

/**
 * Apply gravity to a velocity vector
 */
export function applyGravity(velocity: Vector2, deltaTime: number): Vector2 {
  return {
    x: velocity.x,
    y: velocity.y + PHYSICS.GRAVITY * deltaTime,
  };
}

/**
 * Update ball position (simple version without spin)
 */
export function updateBallPosition(ball: BallState, deltaTime: number): BallState {
  const newVelocity = applyGravity({ x: ball.velocityX, y: ball.velocityY }, deltaTime);

  let newX = ball.x + newVelocity.x * deltaTime;
  let newY = ball.y + newVelocity.y * deltaTime;
  let velX = newVelocity.x;
  let velY = newVelocity.y;

  // Ground - don't bounce, this triggers scoring
  if (newY + PHYSICS.BALL_RADIUS >= PHYSICS.GROUND_Y) {
    newY = PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS;
  }

  // Ceiling bounce
  if (newY - PHYSICS.BALL_RADIUS <= 0) {
    newY = PHYSICS.BALL_RADIUS;
    velY = Math.abs(velY) * PHYSICS.BALL_BOUNCE;
  }

  // Wall bounces
  if (newX - PHYSICS.BALL_RADIUS <= 0) {
    newX = PHYSICS.BALL_RADIUS;
    velX = Math.abs(velX) * PHYSICS.BALL_BOUNCE;
  }
  if (newX + PHYSICS.BALL_RADIUS >= PHYSICS.COURT_WIDTH) {
    newX = PHYSICS.COURT_WIDTH - PHYSICS.BALL_RADIUS;
    velX = -Math.abs(velX) * PHYSICS.BALL_BOUNCE;
  }

  // Clamp velocity
  const speed = Math.sqrt(velX * velX + velY * velY);
  if (speed > PHYSICS.MAX_BALL_SPEED) {
    const scale = PHYSICS.MAX_BALL_SPEED / speed;
    velX *= scale;
    velY *= scale;
  }

  return {
    ...ball,
    x: newX,
    y: newY,
    velocityX: velX,
    velocityY: velY,
  };
}

/**
 * Check ball-net collision
 */
export function checkNetCollision(ball: BallState): BallState {
  const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
  const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;
  const netTop = PHYSICS.GROUND_Y - PHYSICS.NET_HEIGHT;

  // Check if ball is in net zone
  if (
    ball.x + PHYSICS.BALL_RADIUS >= netLeft &&
    ball.x - PHYSICS.BALL_RADIUS <= netRight &&
    ball.y + PHYSICS.BALL_RADIUS >= netTop
  ) {
    // Determine which side to bounce from
    const fromLeft = ball.velocityX > 0;

    return {
      ...ball,
      x: fromLeft ? netLeft - PHYSICS.BALL_RADIUS : netRight + PHYSICS.BALL_RADIUS,
      velocityX: -ball.velocityX * PHYSICS.BALL_BOUNCE * 0.8,
    };
  }

  return ball;
}

/**
 * Check player-ball collision
 */
export function checkPlayerBallCollision(
  player: PlayerState,
  ball: BallState,
  stats: CharacterStats
): BallState | null {
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < PLAYER_HIT_RANGE + PHYSICS.BALL_RADIUS) {
    const angle = Math.atan2(dy, dx);
    const hitPower = ATTRIBUTE_FORMULAS.power(stats.power);

    // Ensure upward trajectory
    const adjustedAngle = dy < 0 ? angle : Math.min(angle, -Math.PI / 6);

    return {
      ...ball,
      velocityX: Math.cos(adjustedAngle) * hitPower + player.velocityX * 0.3,
      velocityY: Math.sin(adjustedAngle) * hitPower + player.velocityY * 0.3,
      lastHitBy: player.id,
    };
  }

  return null;
}

/**
 * Update player position
 */
export function updatePlayerPosition(
  player: PlayerState,
  input: { left: boolean; right: boolean; jump: boolean },
  stats: CharacterStats,
  deltaTime: number
): PlayerState {
  const moveSpeed = ATTRIBUTE_FORMULAS.speed(stats.speed);
  const jumpForce = ATTRIBUTE_FORMULAS.jump(stats.jump);

  let velX = 0;
  let velY = player.velocityY;

  // Horizontal movement
  if (input.left) velX -= moveSpeed;
  if (input.right) velX += moveSpeed;

  // Jump
  if (input.jump && !player.isJumping) {
    velY = -jumpForce;
  }

  // Apply gravity
  velY += PHYSICS.GRAVITY * deltaTime;

  let newX = player.x + velX * deltaTime;
  let newY = player.y + velY * deltaTime;
  let isJumping = true;

  // Ground collision
  const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
  if (newY >= groundY) {
    newY = groundY;
    velY = 0;
    isJumping = false;
  }

  // Court boundaries (respect sides)
  const halfWidth = PHYSICS.PLAYER_WIDTH / 2;
  const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
  const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;

  if (player.side === 'left') {
    newX = Math.max(halfWidth, Math.min(newX, netLeft - halfWidth));
  } else {
    newX = Math.max(netRight + halfWidth, Math.min(newX, PHYSICS.COURT_WIDTH - halfWidth));
  }

  return {
    ...player,
    x: newX,
    y: newY,
    velocityX: velX,
    velocityY: velY,
    isJumping,
  };
}

/**
 * Check scoring condition
 */
export function checkScoring(ball: BallState): 'left' | 'right' | null {
  if (ball.y + PHYSICS.BALL_RADIUS >= PHYSICS.GROUND_Y) {
    return ball.x < PHYSICS.COURT_WIDTH / 2 ? 'right' : 'left';
  }
  return null;
}

/**
 * Get serving position for a side
 */
export function getServingPosition(side: 'left' | 'right'): Vector2 {
  return {
    x: side === 'left' ? PHYSICS.COURT_WIDTH / 4 : (PHYSICS.COURT_WIDTH * 3) / 4,
    y: 80,
  };
}

/**
 * Create reset ball state for serving
 */
export function resetBallPosition(servingSide: 'left' | 'right'): BallState {
  const pos = getServingPosition(servingSide);
  return {
    x: pos.x,
    y: pos.y,
    velocityX: 0,
    velocityY: 0,
    lastHitBy: null,
  };
}
