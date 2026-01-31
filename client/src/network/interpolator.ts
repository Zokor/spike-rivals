import type { PlayerState, BallState } from '@spike-rivals/shared';

// ============================================================================
// Types
// ============================================================================

export interface EntityState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export interface PlayerEntityState extends EntityState {
  isJumping: boolean;
  side: 'left' | 'right';
  characterId: string;
  score: number;
}

export interface BallEntityState extends EntityState {
  spin?: number;
  lastHitBy: string | null;
}

export interface StateSnapshot<T> {
  state: T;
  timestamp: number;
}

export interface InterpolatorConfig {
  // Delay behind real-time for interpolation (ms)
  interpolationDelay: number;
  // Maximum age of states to keep (ms)
  maxStateAge: number;
  // Enable extrapolation when no future state available
  enableExtrapolation: boolean;
  // Maximum extrapolation time (ms)
  maxExtrapolationTime: number;
  // Enable debug logging
  debug: boolean;
}

const DEFAULT_CONFIG: InterpolatorConfig = {
  interpolationDelay: 100, // 100ms behind real-time
  maxStateAge: 1000, // Keep 1 second of states
  enableExtrapolation: true,
  maxExtrapolationTime: 200, // Max 200ms extrapolation
  debug: false,
};

// ============================================================================
// Generic Interpolator Class
// ============================================================================

export class Interpolator<T extends EntityState> {
  private config: InterpolatorConfig;
  private stateBuffer: StateSnapshot<T>[] = [];
  private entityId: string;

  constructor(entityId: string, config: Partial<InterpolatorConfig> = {}) {
    this.entityId = entityId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Add a new state snapshot from the server
   */
  addState(state: T, timestamp: number): void {
    // Insert in sorted order by timestamp
    const snapshot: StateSnapshot<T> = { state, timestamp };

    // Find correct insertion point
    let insertIndex = this.stateBuffer.length;
    for (let i = this.stateBuffer.length - 1; i >= 0; i--) {
      if (this.stateBuffer[i].timestamp <= timestamp) {
        insertIndex = i + 1;
        break;
      }
      if (i === 0) {
        insertIndex = 0;
      }
    }

    this.stateBuffer.splice(insertIndex, 0, snapshot);

    // Prune old states
    const cutoffTime = timestamp - this.config.maxStateAge;
    this.stateBuffer = this.stateBuffer.filter((s) => s.timestamp > cutoffTime);

    this.log(`Added state at ${timestamp}, buffer size: ${this.stateBuffer.length}`);
  }

  /**
   * Get interpolated state for the current render time
   */
  getInterpolatedState(currentTime: number): T | null {
    if (this.stateBuffer.length === 0) {
      return null;
    }

    // Calculate render time (behind real-time by interpolation delay)
    const renderTime = currentTime - this.config.interpolationDelay;

    // Find the two states to interpolate between
    let before: StateSnapshot<T> | null = null;
    let after: StateSnapshot<T> | null = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (
        this.stateBuffer[i].timestamp <= renderTime &&
        this.stateBuffer[i + 1].timestamp >= renderTime
      ) {
        before = this.stateBuffer[i];
        after = this.stateBuffer[i + 1];
        break;
      }
    }

    // Case 1: Found two states to interpolate between
    if (before && after) {
      const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp);
      return this.lerp(before.state, after.state, Math.max(0, Math.min(1, t)));
    }

    // Case 2: Render time is before all states - use oldest
    if (this.stateBuffer.length > 0 && renderTime < this.stateBuffer[0].timestamp) {
      return this.stateBuffer[0].state;
    }

    // Case 3: Render time is after all states - extrapolate or use latest
    const latestSnapshot = this.stateBuffer[this.stateBuffer.length - 1];

    if (this.config.enableExtrapolation) {
      const timeSinceLatest = renderTime - latestSnapshot.timestamp;

      if (timeSinceLatest <= this.config.maxExtrapolationTime) {
        return this.extrapolate(latestSnapshot.state, timeSinceLatest);
      }
    }

    // Fallback to latest state
    return latestSnapshot.state;
  }

  // ============================================================================
  // Interpolation / Extrapolation
  // ============================================================================

  /**
   * Linear interpolation between two states
   */
  private lerp(a: T, b: T, t: number): T {
    // Create a new object with interpolated values
    const result = { ...a };

    result.x = a.x + (b.x - a.x) * t;
    result.y = a.y + (b.y - a.y) * t;
    result.velocityX = a.velocityX + (b.velocityX - a.velocityX) * t;
    result.velocityY = a.velocityY + (b.velocityY - a.velocityY) * t;

    return result;
  }

  /**
   * Extrapolate state based on velocity
   */
  private extrapolate(state: T, deltaMs: number): T {
    const deltaSeconds = deltaMs / 1000;

    const result = { ...state };
    result.x = state.x + state.velocityX * deltaSeconds;
    result.y = state.y + state.velocityY * deltaSeconds;

    return result;
  }

  // ============================================================================
  // Utility
  // ============================================================================

  /**
   * Clear all buffered states
   */
  clear(): void {
    this.stateBuffer = [];
    this.log('Cleared state buffer');
  }

  /**
   * Get the number of buffered states
   */
  getBufferSize(): number {
    return this.stateBuffer.length;
  }

  /**
   * Get the latest raw state (no interpolation)
   */
  getLatestState(): T | null {
    if (this.stateBuffer.length === 0) return null;
    return this.stateBuffer[this.stateBuffer.length - 1].state;
  }

  /**
   * Get interpolation delay setting
   */
  getInterpolationDelay(): number {
    return this.config.interpolationDelay;
  }

  /**
   * Dynamically adjust interpolation delay
   */
  setInterpolationDelay(delay: number): void {
    this.config.interpolationDelay = Math.max(0, delay);
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[Interpolator:${this.entityId}] ${message}`);
    }
  }
}

// ============================================================================
// Specialized Player Interpolator
// ============================================================================

export class PlayerInterpolator extends Interpolator<PlayerEntityState> {
  constructor(playerId: string, config?: Partial<InterpolatorConfig>) {
    super(playerId, config);
  }

  /**
   * Add player state from server
   */
  addPlayerState(player: PlayerState, timestamp: number): void {
    const entityState: PlayerEntityState = {
      x: player.x,
      y: player.y,
      velocityX: player.velocityX,
      velocityY: player.velocityY,
      isJumping: player.isJumping,
      side: player.side,
      characterId: player.characterId,
      score: player.score,
    };

    this.addState(entityState, timestamp);
  }
}

// ============================================================================
// Specialized Ball Interpolator
// ============================================================================

export class BallInterpolator extends Interpolator<BallEntityState> {
  private gravity: number = 800; // Match physics constants

  constructor(config?: Partial<InterpolatorConfig>) {
    // Ball needs shorter delay for responsiveness
    super('ball', {
      interpolationDelay: 50, // Less delay for ball
      enableExtrapolation: true,
      maxExtrapolationTime: 100,
      ...config,
    });
  }

  /**
   * Add ball state from server
   */
  addBallState(ball: BallState, timestamp: number): void {
    const entityState: BallEntityState = {
      x: ball.x,
      y: ball.y,
      velocityX: ball.velocityX,
      velocityY: ball.velocityY,
      lastHitBy: ball.lastHitBy,
    };

    this.addState(entityState, timestamp);
  }

  /**
   * Override extrapolation to include gravity
   */
  protected extrapolate(state: BallEntityState, deltaMs: number): BallEntityState {
    const deltaSeconds = deltaMs / 1000;

    const result = { ...state };

    // Apply velocity
    result.x = state.x + state.velocityX * deltaSeconds;
    result.y = state.y + state.velocityY * deltaSeconds + 0.5 * this.gravity * deltaSeconds * deltaSeconds;

    // Update velocity with gravity
    result.velocityY = state.velocityY + this.gravity * deltaSeconds;

    return result;
  }
}

// ============================================================================
// Network State Manager (combines prediction + interpolation)
// ============================================================================

export interface NetworkStateManagerConfig {
  interpolatorConfig?: Partial<InterpolatorConfig>;
  debug?: boolean;
}

export class NetworkStateManager {
  private localPlayerId: string | null = null;
  private opponentInterpolator: PlayerInterpolator | null = null;
  private ballInterpolator: BallInterpolator;
  private debug: boolean;

  constructor(config: NetworkStateManagerConfig = {}) {
    this.debug = config.debug ?? false;
    this.ballInterpolator = new BallInterpolator(config.interpolatorConfig);
  }

  /**
   * Set local player ID (for filtering)
   */
  setLocalPlayerId(playerId: string): void {
    this.localPlayerId = playerId;
    this.log(`Local player set to ${playerId}`);
  }

  /**
   * Initialize opponent interpolator
   */
  initializeOpponent(playerId: string): void {
    this.opponentInterpolator = new PlayerInterpolator(playerId, {
      interpolationDelay: 100,
    });
    this.log(`Opponent interpolator initialized for ${playerId}`);
  }

  /**
   * Process incoming server state
   */
  onServerState(
    players: Map<string, PlayerState>,
    ball: BallState,
    timestamp: number
  ): void {
    // Add ball state
    this.ballInterpolator.addBallState(ball, timestamp);

    // Add opponent states (skip local player)
    players.forEach((player, playerId) => {
      if (playerId !== this.localPlayerId) {
        if (!this.opponentInterpolator) {
          this.initializeOpponent(playerId);
        }
        this.opponentInterpolator?.addPlayerState(player, timestamp);
      }
    });
  }

  /**
   * Get interpolated opponent position for rendering
   */
  getOpponentState(currentTime: number): PlayerEntityState | null {
    return this.opponentInterpolator?.getInterpolatedState(currentTime) ?? null;
  }

  /**
   * Get interpolated ball position for rendering
   */
  getBallState(currentTime: number): BallEntityState | null {
    return this.ballInterpolator.getInterpolatedState(currentTime);
  }

  /**
   * Get latest raw states (for debugging)
   */
  getLatestStates(): {
    opponent: PlayerEntityState | null;
    ball: BallEntityState | null;
  } {
    return {
      opponent: this.opponentInterpolator?.getLatestState() ?? null,
      ball: this.ballInterpolator.getLatestState(),
    };
  }

  /**
   * Get network statistics
   */
  getStats(): {
    opponentBufferSize: number;
    ballBufferSize: number;
    interpolationDelay: number;
  } {
    return {
      opponentBufferSize: this.opponentInterpolator?.getBufferSize() ?? 0,
      ballBufferSize: this.ballInterpolator.getBufferSize(),
      interpolationDelay: this.ballInterpolator.getInterpolationDelay(),
    };
  }

  /**
   * Clear all state buffers
   */
  clear(): void {
    this.opponentInterpolator?.clear();
    this.ballInterpolator.clear();
    this.log('Cleared all interpolators');
  }

  /**
   * Reset the manager
   */
  reset(): void {
    this.localPlayerId = null;
    this.opponentInterpolator = null;
    this.ballInterpolator = new BallInterpolator();
    this.log('Reset');
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[NetworkStateManager] ${message}`);
    }
  }
}

// ============================================================================
// Factory functions
// ============================================================================

export function createInterpolator<T extends EntityState>(
  entityId: string,
  config?: Partial<InterpolatorConfig>
): Interpolator<T> {
  return new Interpolator<T>(entityId, config);
}

export function createPlayerInterpolator(
  playerId: string,
  config?: Partial<InterpolatorConfig>
): PlayerInterpolator {
  return new PlayerInterpolator(playerId, config);
}

export function createBallInterpolator(
  config?: Partial<InterpolatorConfig>
): BallInterpolator {
  return new BallInterpolator(config);
}

export function createNetworkStateManager(
  config?: NetworkStateManagerConfig
): NetworkStateManager {
  return new NetworkStateManager(config);
}
