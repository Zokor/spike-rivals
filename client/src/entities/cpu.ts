import { PHYSICS } from '@spike-rivals/shared';
import type { Player, InputState } from './player';
import type { Ball } from './ball';

export type CpuDifficulty = 'easy' | 'medium' | 'hard' | 'impossible';

interface DifficultyConfig {
  reactionDelay: number; // ms before reacting to ball changes
  predictionAccuracy: number; // 0-1, how accurately it predicts ball landing
  missChance: number; // 0-1, chance to intentionally miss
  hitPowerMultiplier: number; // 0-1, multiplier for hit power
  strategicAim: boolean; // Whether to aim for corners/difficult positions
  moveSpeedMultiplier: number; // How fast the CPU moves relative to max
  jumpTimingError: number; // ms error in jump timing (randomized)
  decisionInterval: number; // How often to reconsider strategy (ms)
  humanErrorChance: number; // Chance to make random mistakes
}

const DIFFICULTY_CONFIGS: Record<CpuDifficulty, DifficultyConfig> = {
  easy: {
    reactionDelay: 500,
    predictionAccuracy: 0.5,
    missChance: 0.3,
    hitPowerMultiplier: 0.6,
    strategicAim: false,
    moveSpeedMultiplier: 0.6,
    jumpTimingError: 300,
    decisionInterval: 500,
    humanErrorChance: 0.15,
  },
  medium: {
    reactionDelay: 300,
    predictionAccuracy: 0.7,
    missChance: 0.15,
    hitPowerMultiplier: 0.8,
    strategicAim: false,
    moveSpeedMultiplier: 0.8,
    jumpTimingError: 150,
    decisionInterval: 300,
    humanErrorChance: 0.08,
  },
  hard: {
    reactionDelay: 150,
    predictionAccuracy: 0.9,
    missChance: 0.05,
    hitPowerMultiplier: 0.95,
    strategicAim: true,
    moveSpeedMultiplier: 0.95,
    jumpTimingError: 80,
    decisionInterval: 150,
    humanErrorChance: 0.03,
  },
  impossible: {
    reactionDelay: 50,
    predictionAccuracy: 1.0,
    missChance: 0.0,
    hitPowerMultiplier: 1.0,
    strategicAim: true,
    moveSpeedMultiplier: 1.0,
    jumpTimingError: 20,
    decisionInterval: 50,
    humanErrorChance: 0.0,
  },
};

type AiState = 'idle' | 'tracking' | 'intercepting' | 'returning' | 'jumping' | 'hitting';

interface PredictedLanding {
  x: number;
  y: number;
  time: number; // seconds until landing
}

export class CpuController {
  private player: Player;
  private ball: Ball;
  private config: DifficultyConfig;
  private difficulty: CpuDifficulty;

  // Timers
  private reactionTimer = 0;
  private decisionTimer = 0;
  private jumpTimer = 0;

  // State
  private aiState: AiState = 'idle';
  private targetX = 0;
  private predictedLanding: PredictedLanding | null = null;
  private shouldMiss = false;
  private plannedJumpTime = 0;
  private hasPlannedJump = false;

  // Court positions
  private readonly homeX: number;
  private readonly courtMiddle = PHYSICS.COURT_WIDTH / 2;
  private readonly mySideStart: number;
  private readonly mySideEnd: number;

  // Input state (mimics player input)
  private currentInput: InputState = {
    moveX: 0,
    moveY: 0,
    jump: false,
    jumpPressed: false,
    action: false,
  };

  constructor(player: Player, ball: Ball, difficulty: CpuDifficulty = 'medium') {
    this.player = player;
    this.ball = ball;
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIGS[difficulty];

    // Calculate court positions for right side player
    this.mySideStart = this.courtMiddle + PHYSICS.NET_COLLISION_WIDTH / 2;
    this.mySideEnd = PHYSICS.COURT_WIDTH;
    this.homeX = this.mySideStart + (this.mySideEnd - this.mySideStart) / 2;
  }

  /**
   * Change difficulty level
   */
  setDifficulty(difficulty: CpuDifficulty): void {
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIGS[difficulty];
  }

  /**
   * Get current difficulty
   */
  getDifficulty(): CpuDifficulty {
    return this.difficulty;
  }

  /**
   * Main update loop - called every frame
   */
  update(delta: number): void {
    // Update timers
    this.reactionTimer += delta;
    this.decisionTimer += delta;
    this.jumpTimer += delta;

    // Apply reaction delay before processing
    if (this.reactionTimer < this.config.reactionDelay) {
      // During reaction delay, continue previous action with some momentum
      this.applyInput();
      return;
    }

    // Make decisions at intervals
    if (this.decisionTimer >= this.config.decisionInterval) {
      this.decisionTimer = 0;
      this.makeDecision();
    }

    // Execute current strategy
    this.executeStrategy(delta);

    // Apply the input to the player
    this.applyInput();
  }

  /**
   * Analyze game state and decide on strategy
   */
  private makeDecision(): void {
    const ballVel = this.ball.getVelocity();
    const ballOnMySide = this.ball.x > this.courtMiddle;
    const ballComingToMe = ballVel.x > 0;
    const ballGoingUp = ballVel.y < 0;

    // Predict where ball will land
    this.predictedLanding = this.predictBallLanding();

    // Random human error - sometimes make wrong decisions
    if (Math.random() < this.config.humanErrorChance) {
      this.makeRandomError();
      return;
    }

    // Decide if we should intentionally miss
    this.shouldMiss = Math.random() < this.config.missChance;

    // Determine AI state based on ball position and trajectory
    if (ballOnMySide) {
      if (this.isBallInHitRange()) {
        this.aiState = 'hitting';
      } else if (this.shouldPrepareJump()) {
        this.aiState = 'jumping';
        this.planJump();
      } else {
        this.aiState = 'intercepting';
      }
    } else if (ballComingToMe) {
      this.aiState = 'tracking';
    } else {
      this.aiState = 'returning';
    }

    // Calculate target position
    this.calculateTargetPosition();
  }

  /**
   * Execute the current strategy
   */
  private executeStrategy(delta: number): void {
    // Reset input
    this.currentInput = {
      moveX: 0,
      moveY: 0,
      jump: false,
      jumpPressed: false,
      action: false,
    };

    switch (this.aiState) {
      case 'idle':
        this.executeIdle();
        break;
      case 'tracking':
        this.executeTracking();
        break;
      case 'intercepting':
        this.executeIntercepting();
        break;
      case 'returning':
        this.executeReturning();
        break;
      case 'jumping':
        this.executeJumping(delta);
        break;
      case 'hitting':
        this.executeHitting();
        break;
    }
  }

  /**
   * Idle state - stay at home position
   */
  private executeIdle(): void {
    this.moveTowardsTarget(this.homeX);
  }

  /**
   * Tracking state - follow ball trajectory while it's coming
   */
  private executeTracking(): void {
    if (this.predictedLanding && this.predictedLanding.x > this.courtMiddle) {
      // Move towards predicted landing with some anticipation
      const anticipatedX = this.applyPredictionError(this.predictedLanding.x);
      this.moveTowardsTarget(anticipatedX);
    } else {
      // Stay near home but ready
      this.moveTowardsTarget(this.mySideStart + 30);
    }
  }

  /**
   * Intercepting state - actively trying to reach the ball
   */
  private executeIntercepting(): void {
    if (this.shouldMiss) {
      // Intentionally move to wrong position
      const wrongTarget = this.ball.x + (Math.random() > 0.5 ? 50 : -50);
      this.moveTowardsTarget(wrongTarget);
    } else {
      // Move towards ball or predicted landing
      const targetX = this.predictedLanding
        ? this.applyPredictionError(this.predictedLanding.x)
        : this.ball.x;
      this.moveTowardsTarget(targetX);
    }
  }

  /**
   * Returning state - going back to home position
   */
  private executeReturning(): void {
    this.moveTowardsTarget(this.homeX);
  }

  /**
   * Jumping state - execute a planned jump
   */
  private executeJumping(delta: number): void {
    // Continue moving towards ball
    this.moveTowardsTarget(this.ball.x);

    // Check if it's time to jump
    if (this.hasPlannedJump && this.jumpTimer >= this.plannedJumpTime) {
      const timingError = (Math.random() - 0.5) * this.config.jumpTimingError;

      if (this.jumpTimer >= this.plannedJumpTime + timingError) {
        this.currentInput.jumpPressed = true;
        this.hasPlannedJump = false;
      }
    }
  }

  /**
   * Hitting state - ball is in range, try to hit it
   */
  private executeHitting(): void {
    // Move towards ball
    this.moveTowardsTarget(this.ball.x);

    // Jump if ball is above us
    if (this.ball.y < PHYSICS.GROUND_Y - 50 && this.player.getIsGrounded()) {
      this.currentInput.jumpPressed = true;
    }
  }

  /**
   * Move towards a target X position
   */
  private moveTowardsTarget(targetX: number): void {
    const dx = targetX - this.player.x;
    const threshold = 8; // Dead zone to prevent jittering

    if (Math.abs(dx) > threshold) {
      // Apply speed multiplier
      const moveAmount = dx > 0 ? 1 : -1;
      this.currentInput.moveX = moveAmount * this.config.moveSpeedMultiplier;
    } else {
      this.currentInput.moveX = 0;
    }
  }

  /**
   * Apply input to the player
   */
  private applyInput(): void {
    // Convert moveX multiplier to actual movement
    if (this.currentInput.moveX < -0.1) {
      this.player.moveLeft();
    } else if (this.currentInput.moveX > 0.1) {
      this.player.moveRight();
    } else {
      this.player.stop();
    }

    // Handle jump
    if (this.currentInput.jumpPressed) {
      this.player.jump();
    }
  }

  /**
   * Predict where the ball will land
   */
  private predictBallLanding(): PredictedLanding | null {
    // Use ball's built-in prediction if available
    const ballPrediction = this.ball.predictLanding();

    if (!ballPrediction) {
      return null;
    }

    return {
      x: ballPrediction.x,
      y: PHYSICS.GROUND_Y,
      time: ballPrediction.time,
    };
  }

  /**
   * Apply prediction inaccuracy based on difficulty
   */
  private applyPredictionError(predictedX: number): number {
    const accuracy = this.config.predictionAccuracy;
    const maxError = (1 - accuracy) * 80; // Max error of 80 pixels at 0% accuracy
    const error = (Math.random() - 0.5) * maxError;
    return predictedX + error;
  }

  /**
   * Check if ball is within hitting range
   */
  private isBallInHitRange(): boolean {
    const dx = this.ball.x - this.player.x;
    const dy = this.ball.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 35; // Slightly larger than player's hit range
  }

  /**
   * Determine if CPU should prepare to jump
   */
  private shouldPrepareJump(): boolean {
    const ballVel = this.ball.getVelocity();
    const ballOnMySide = this.ball.x > this.courtMiddle;

    // Jump conditions:
    // 1. Ball is on my side
    // 2. Ball is above ground level
    // 3. Ball is coming down or at peak
    // 4. I'm close enough horizontally
    const closeEnough = Math.abs(this.ball.x - this.player.x) < 60;
    const ballAbove = this.ball.y < PHYSICS.GROUND_Y - 60;
    const ballDescending = ballVel.y >= 0;

    return ballOnMySide && ballAbove && closeEnough && (ballDescending || ballVel.y > -100);
  }

  /**
   * Plan when to jump based on ball trajectory
   */
  private planJump(): void {
    if (this.hasPlannedJump) return;

    const ballVel = this.ball.getVelocity();

    // Estimate time until ball is at optimal hit height
    const optimalHeight = PHYSICS.GROUND_Y - 60; // Ideal height to hit
    const currentHeight = this.ball.y;

    if (currentHeight >= optimalHeight) {
      // Ball is already low, jump now
      this.plannedJumpTime = 0;
    } else {
      // Calculate time to reach optimal height using physics
      // Using kinematic equation: y = y0 + v*t + 0.5*g*t^2
      const dy = optimalHeight - currentHeight;
      const g = PHYSICS.GRAVITY;
      const v = ballVel.y;

      // Solve quadratic: 0.5*g*t^2 + v*t - dy = 0
      const a = 0.5 * g;
      const b = v;
      const c = -dy;
      const discriminant = b * b - 4 * a * c;

      if (discriminant >= 0) {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const timeToOptimal = Math.max(t1, t2) * 1000; // Convert to ms

        // Jump slightly before optimal time to account for jump duration
        const jumpDuration = 300; // Approximate time to reach peak
        this.plannedJumpTime = Math.max(0, timeToOptimal - jumpDuration);
      } else {
        this.plannedJumpTime = 100;
      }
    }

    this.hasPlannedJump = true;
    this.jumpTimer = 0;
  }

  /**
   * Calculate strategic target position (for aiming)
   */
  private calculateTargetPosition(): void {
    if (!this.config.strategicAim || !this.predictedLanding) {
      this.targetX = this.predictedLanding?.x ?? this.ball.x;
      return;
    }

    // Strategic aiming - position to hit ball towards difficult spots
    const opponentX = this.courtMiddle / 2; // Assume opponent is center of their side

    // Aim towards corners or away from opponent
    if (this.predictedLanding.x > this.player.x) {
      // Ball coming from right, aim left corner
      this.targetX = this.predictedLanding.x - 10;
    } else {
      // Ball coming from left, aim right corner
      this.targetX = this.predictedLanding.x + 10;
    }
  }

  /**
   * Intentionally make a random error (for human-like behavior)
   */
  private makeRandomError(): void {
    const errorType = Math.random();

    if (errorType < 0.3) {
      // Wrong direction briefly
      this.aiState = 'returning';
    } else if (errorType < 0.6) {
      // Delayed reaction
      this.reactionTimer = -this.config.reactionDelay;
    } else {
      // Miss the jump timing
      this.hasPlannedJump = false;
    }
  }

  /**
   * Reset the CPU state
   */
  reset(): void {
    this.aiState = 'idle';
    this.reactionTimer = 0;
    this.decisionTimer = 0;
    this.jumpTimer = 0;
    this.hasPlannedJump = false;
    this.shouldMiss = false;
    this.targetX = this.homeX;
    this.predictedLanding = null;

    this.currentInput = {
      moveX: 0,
      moveY: 0,
      jump: false,
      jumpPressed: false,
      action: false,
    };
  }

  /**
   * Get current AI state (for debugging)
   */
  getState(): AiState {
    return this.aiState;
  }

  /**
   * Get predicted landing position (for debugging)
   */
  getPredictedLanding(): PredictedLanding | null {
    return this.predictedLanding;
  }
}
