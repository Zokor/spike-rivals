import {
  type PlayerState,
  type BallState,
  type PlayerInput,
  type CharacterId,
  PhysicsSimulation,
  type PlayerInputState,
  type SimulationState,
  FIXED_TIMESTEP,
} from '@spike-rivals/shared';

// ============================================================================
// Types
// ============================================================================

export interface InputSnapshot {
  tick: number;
  input: PlayerInput;
  timestamp: number;
}

export interface ServerStateSnapshot {
  tick: number;
  timestamp: number;
  players: Map<string, PlayerState>;
  ball: BallState;
}

export interface PredictionConfig {
  // Maximum number of inputs to buffer
  maxInputBuffer: number;
  // Error threshold for position correction (pixels)
  positionErrorThreshold: number;
  // Interpolation speed for smooth corrections (0-1)
  correctionSpeed: number;
  // Maximum ticks to re-simulate
  maxResimulationTicks: number;
  // Enable debug logging
  debug: boolean;
}

const DEFAULT_CONFIG: PredictionConfig = {
  maxInputBuffer: 60, // 1 second at 60 FPS
  positionErrorThreshold: 2, // 2 pixels before correction
  correctionSpeed: 0.2, // 20% correction per frame
  maxResimulationTicks: 30, // Max half second resimulation
  debug: false,
};

// ============================================================================
// PredictionManager Class
// ============================================================================

export class PredictionManager {
  private config: PredictionConfig;
  private seed: number | null = null;

  // Local player ID
  private localPlayerId: string | null = null;
  private localCharacterId: CharacterId = 'nova';
  private localSide: 'left' | 'right' = 'left';

  // Physics simulation for prediction
  private simulation: PhysicsSimulation;

  // Input buffering
  private inputBuffer: InputSnapshot[] = [];
  private currentTick: number = 0;

  // Server state tracking
  private lastConfirmedTick: number = 0;
  private lastConfirmedState: SimulationState | null = null;

  // Predicted state (what we show to the player)
  private predictedState: SimulationState | null = null;

  // Correction tracking
  private correctionOffset: { x: number; y: number } = { x: 0, y: 0 };

  // Callbacks
  private onInputSend: ((input: PlayerInput, tick: number) => void) | null = null;

  constructor(config: Partial<PredictionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.simulation = new PhysicsSimulation();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the prediction manager with local player info
   */
  initialize(
    playerId: string,
    characterId: CharacterId,
    side: 'left' | 'right',
    characterStats: { speed: number; jump: number; power: number; control: number }
  ): void {
    this.localPlayerId = playerId;
    this.localCharacterId = characterId;
    this.localSide = side;

    // Add local player to simulation
    this.simulation.addPlayer(playerId, side, characterId, characterStats);

    this.log(`Initialized for player ${playerId} on ${side} side`);
  }

  /**
   * Add opponent player to simulation
   */
  addOpponent(
    playerId: string,
    characterId: CharacterId,
    side: 'left' | 'right',
    characterStats: { speed: number; jump: number; power: number; control: number }
  ): void {
    this.simulation.addPlayer(playerId, side, characterId, characterStats);
    this.log(`Added opponent ${playerId} on ${side} side`);
  }

  /**
   * Set callback for sending inputs to server
   */
  setInputSendCallback(callback: (input: PlayerInput, tick: number) => void): void {
    this.onInputSend = callback;
  }

  // ============================================================================
  // Input Handling
  // ============================================================================

  /**
   * Process local player input
   * - Apply immediately to local simulation
   * - Buffer for reconciliation
   * - Send to server
   */
  onLocalInput(input: PlayerInput): void {
    if (!this.localPlayerId) {
      if (import.meta.env.DEV) {
        console.warn('PredictionManager: Cannot process input - not initialized');
      }
      return;
    }

    const tick = this.currentTick;
    const timestamp = Date.now();

    // 1. Store in buffer for reconciliation
    this.inputBuffer.push({ tick, input, timestamp });

    // Trim buffer if too large
    if (this.inputBuffer.length > this.config.maxInputBuffer) {
      this.inputBuffer.shift();
    }

    // 2. Apply input to local prediction
    this.applyInputLocally(input);

    // 3. Send to server
    if (this.onInputSend) {
      this.onInputSend(input, tick);
    }

    // Increment tick
    this.currentTick++;
  }

  /**
   * Apply input to local simulation immediately
   */
  private applyInputLocally(input: PlayerInput): void {
    if (!this.localPlayerId) return;

    // Convert PlayerInput to PlayerInputState
    const inputState: PlayerInputState = {
      left: input.left,
      right: input.right,
      jump: input.jump,
      jumpPressed: input.jumpPressed ?? false,
    };

    // Create input map with just local player
    const inputs = new Map<string, PlayerInputState>();
    inputs.set(this.localPlayerId, inputState);

    // Step simulation
    this.simulation.step(inputs);

    // Update predicted state
    this.predictedState = this.simulation.getState();
  }

  // ============================================================================
  // Server State Reconciliation
  // ============================================================================

  /**
   * Handle incoming server state
   * - Compare with predicted state
   * - Reconcile if error exceeds threshold
   * - Re-simulate buffered inputs
   */
  onServerState(
    serverState: {
      players: Map<string, PlayerState>;
      ball: BallState;
      tick: number;
    }
  ): void {
    const { tick } = serverState;

    // Store as last confirmed state
    this.lastConfirmedTick = tick;
    this.lastConfirmedState = this.convertToSimulationState(serverState);

    // Remove old inputs that server has already processed
    this.inputBuffer = this.inputBuffer.filter((snapshot) => snapshot.tick > tick);

    // Check if we need to reconcile
    if (this.needsReconciliation(serverState)) {
      this.reconcile(serverState, tick);
    }
  }

  /**
   * Check if prediction error exceeds threshold
   */
  private needsReconciliation(serverState: { players: Map<string, PlayerState> }): boolean {
    if (!this.localPlayerId || !this.predictedState) return false;

    const serverPlayer = serverState.players.get(this.localPlayerId);
    const predictedPlayer = this.predictedState.players.get(this.localPlayerId);

    if (!serverPlayer || !predictedPlayer) return false;

    const dx = Math.abs(serverPlayer.x - predictedPlayer.x);
    const dy = Math.abs(serverPlayer.y - predictedPlayer.y);
    const error = Math.sqrt(dx * dx + dy * dy);

    if (error > this.config.positionErrorThreshold) {
      this.log(`Reconciliation needed: error = ${error.toFixed(2)}px`);
      return true;
    }

    return false;
  }

  /**
   * Reconcile local state with server state
   */
  private reconcile(
    serverState: { players: Map<string, PlayerState>; ball: BallState },
    serverTick: number
  ): void {
    if (!this.localPlayerId) return;

    // 1. Reset simulation to server state
    const simulationState = this.convertToSimulationState(serverState);
    this.simulation.setState(simulationState);

    // 2. Re-apply buffered inputs that haven't been processed by server
    const inputsToReapply = this.inputBuffer.filter((s) => s.tick > serverTick);

    // Limit resimulation to prevent stuttering
    const ticksToSimulate = Math.min(inputsToReapply.length, this.config.maxResimulationTicks);

    this.log(`Re-simulating ${ticksToSimulate} ticks`);

    for (let i = 0; i < ticksToSimulate; i++) {
      const snapshot = inputsToReapply[i];
      const inputState: PlayerInputState = {
        left: snapshot.input.left,
        right: snapshot.input.right,
        jump: snapshot.input.jump,
        jumpPressed: snapshot.input.jumpPressed ?? false,
      };

      const inputs = new Map<string, PlayerInputState>();
      inputs.set(this.localPlayerId, inputState);

      this.simulation.step(inputs);
    }

    // 3. Get new predicted state
    const newPredictedState = this.simulation.getState();

    // 4. Calculate correction offset for smooth interpolation
    if (this.predictedState && this.localPlayerId) {
      const oldPlayer = this.predictedState.players.get(this.localPlayerId);
      const newPlayer = newPredictedState.players.get(this.localPlayerId);

      if (oldPlayer && newPlayer) {
        // Store the difference to interpolate smoothly
        this.correctionOffset = {
          x: oldPlayer.x - newPlayer.x,
          y: oldPlayer.y - newPlayer.y,
        };
      }
    }

    this.predictedState = newPredictedState;
  }

  /**
   * Convert server state format to simulation state format
   */
  private convertToSimulationState(serverState: {
    players: Map<string, PlayerState>;
    ball: BallState;
  }): SimulationState {
    const players = new Map();

    serverState.players.forEach((player, id) => {
      players.set(id, {
        x: player.x,
        y: player.y,
        velocityX: player.velocityX,
        velocityY: player.velocityY,
        isGrounded: player.y >= 198, // Approximate ground check
        canHit: true,
        hitCooldown: 0,
        side: player.side,
        characterId: player.characterId,
      });
    });

    return {
      players,
      ball: {
        x: serverState.ball.x,
        y: serverState.ball.y,
        velocityX: serverState.ball.velocityX,
        velocityY: serverState.ball.velocityY,
        spin: 0,
        lastHitBy: serverState.ball.lastHitBy,
      },
      score: { left: 0, right: 0 },
      servingSide: 'left',
    };
  }

  // ============================================================================
  // State Access (for rendering)
  // ============================================================================

  /**
   * Get interpolated local player position for rendering
   * Applies smooth correction offset
   */
  getLocalPlayerPosition(): { x: number; y: number } | null {
    if (!this.localPlayerId || !this.predictedState) return null;

    const player = this.predictedState.players.get(this.localPlayerId);
    if (!player) return null;

    // Apply correction offset with interpolation
    const x = player.x + this.correctionOffset.x;
    const y = player.y + this.correctionOffset.y;

    // Decay correction offset over time
    this.correctionOffset.x *= 1 - this.config.correctionSpeed;
    this.correctionOffset.y *= 1 - this.config.correctionSpeed;

    // Zero out tiny corrections
    if (Math.abs(this.correctionOffset.x) < 0.1) this.correctionOffset.x = 0;
    if (Math.abs(this.correctionOffset.y) < 0.1) this.correctionOffset.y = 0;

    return { x, y };
  }

  /**
   * Get predicted ball position
   */
  getBallPosition(): { x: number; y: number } | null {
    if (!this.predictedState) return null;
    return {
      x: this.predictedState.ball.x,
      y: this.predictedState.ball.y,
    };
  }

  /**
   * Get full predicted state
   */
  getPredictedState(): SimulationState | null {
    return this.predictedState;
  }

  /**
   * Get current tick
   */
  getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Get input buffer size (for debugging/network stats)
   */
  getBufferSize(): number {
    return this.inputBuffer.length;
  }

  /**
   * Get estimated latency in ticks
   */
  getLatencyTicks(): number {
    return this.currentTick - this.lastConfirmedTick;
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  /**
   * Update method to be called every frame
   * Handles correction interpolation
   */
  update(_deltaTime: number): void {
    // Correction offset decay is handled in getLocalPlayerPosition()
    // This method can be extended for additional per-frame logic
  }

  // ============================================================================
  // Utility
  // ============================================================================

  /**
   * Reset the prediction manager
   */
  reset(): void {
    this.inputBuffer = [];
    this.currentTick = 0;
    this.lastConfirmedTick = 0;
    this.lastConfirmedState = null;
    this.predictedState = null;
    this.correctionOffset = { x: 0, y: 0 };
    this.simulation = new PhysicsSimulation(this.seed ?? Date.now());
    this.log('Reset');
  }

  /**
   * Set deterministic seed for prediction (must match server)
   */
  setSeed(seed: number): void {
    this.seed = seed;
    this.simulation.setSeed(seed);
    this.log(`Seed set to ${seed}`);
  }

  /**
   * Sync tick with server
   */
  syncTick(serverTick: number): void {
    this.currentTick = serverTick;
    this.log(`Synced tick to ${serverTick}`);
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[PredictionManager] ${message}`);
    }
  }
}

// ============================================================================
// Factory function
// ============================================================================

export function createPredictionManager(config?: Partial<PredictionConfig>): PredictionManager {
  return new PredictionManager(config);
}
