import { Room, Client, Delayed } from 'colyseus';
import {
  GameState,
  PlayerSchema,
  BallSchema,
  type PlayerInput,
  type JoinOptions,
  type GameStatus,
  type GameMode,
} from '../schema/game-state';
import { PHYSICS, GAME, CHARACTERS, ATTRIBUTE_FORMULAS, SeededRandom } from '@spike-rivals/shared';

// Room configuration
const TICK_RATE = 60; // Server simulation rate (Hz)
const PATCH_RATE = 20; // State sync rate (Hz)
const RECONNECT_TIMEOUT = 30000; // 30 seconds to reconnect
const COUNTDOWN_DURATION = 3; // Seconds
const POINT_SCORED_DELAY = 1500; // ms delay after scoring
const HIT_COOLDOWN = 150; // ms between hits

/**
 * Server-authoritative volleyball game room
 */
export class GameRoom extends Room<GameState> {
  maxClients = 2;
  patchRate = PATCH_RATE;

  private gameLoop?: Delayed;
  private matchTimer?: Delayed;
  private lastTickTime: number = 0;
  private tickAccumulator: number = 0;
  private readonly fixedDeltaTime = 1000 / TICK_RATE;
  private random!: SeededRandom;
  private randomSeed: number = 0;

  // ==================== Lifecycle ====================

  onCreate(options: { mode?: GameMode }): void {
    this.setState(new GameState());
    this.state.mode = options.mode || 'casual';
    this.state.roomId = this.roomId;
    this.randomSeed = Date.now();
    this.random = new SeededRandom(this.randomSeed);
    this.state.seed = this.randomSeed;

    // Set max score based on mode
    const maxScore = this.state.mode === 'ranked' ? GAME.RANKED_POINTS : GAME.CASUAL_POINTS;

    console.log(`[GameRoom] Created room ${this.roomId} (mode: ${this.state.mode})`);

    // Register message handlers
    this.registerMessageHandlers();
  }

  onJoin(client: Client, options: JoinOptions): void {
    console.log(`[GameRoom] Player ${client.sessionId} joining...`);

    // Check for reconnection
    if (this.handleReconnection(client, options)) {
      return;
    }

    // Validate room isn't full
    if (this.state.players.size >= 2) {
      throw new Error('Room is full');
    }

    // Determine side
    const existingPlayers = Array.from(this.state.players.values());
    const leftTaken = existingPlayers.some(p => p.side === 'left');
    const side: 'left' | 'right' = leftTaken ? 'right' : 'left';

    // Create player
    const player = this.createPlayer(client.sessionId, side, options);
    this.state.players.set(client.sessionId, player);

    console.log(`[GameRoom] Player ${client.sessionId} joined as ${side} (${options.username || 'Guest'})`);

    // Check if room is ready to start
    if (this.state.players.size === 2) {
      this.state.status = 'waiting';
      this.broadcast('match_ready', {
        players: this.getPlayersSummary(),
      });
    }

    // Send deterministic seed to client for prediction
    client.send('seed', { seed: this.state.seed });
  }

  async onLeave(client: Client, consented: boolean): Promise<void> {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    console.log(`[GameRoom] Player ${client.sessionId} leaving (consented: ${consented})`);

    // Mark player as disconnected
    player.connected = false;

    // If game is in progress and player didn't consent, allow reconnection
    if (!consented && (this.state.status === 'playing' || this.state.status === 'countdown')) {
      // Pause the game
      if (this.state.status === 'playing') {
        this.pauseGame('Player disconnected');
      }

      // Set up reconnection timeout
      const timeout = setTimeout(() => {
        this.handleReconnectionTimeout(client.sessionId);
      }, RECONNECT_TIMEOUT);

      this.state.disconnectedPlayers.set(client.sessionId, {
        odUserId: player.odUserId,
        timeout,
        side: player.side,
      });

      // Allow reconnection
      try {
        await this.allowReconnection(client, RECONNECT_TIMEOUT);
        // Player reconnected - handled in handleReconnection
      } catch {
        // Reconnection failed/timed out - already handled by timeout
      }
    } else {
      // Player left intentionally or game not in progress
      this.handlePlayerLeave(client.sessionId);
    }
  }

  onDispose(): void {
    console.log(`[GameRoom] Room ${this.roomId} disposing...`);

    // Clear all timers
    if (this.gameLoop) {
      this.gameLoop.clear();
    }
    if (this.matchTimer) {
      this.matchTimer.clear();
    }

    // Clear reconnection timeouts
    this.state.disconnectedPlayers.forEach(({ timeout }) => {
      clearTimeout(timeout);
    });
  }

  // ==================== Message Handlers ====================

  private registerMessageHandlers(): void {
    // Player input
    this.onMessage('input', (client: Client, input: PlayerInput) => {
      this.handleInput(client.sessionId, input);
    });

    // Player ready
    this.onMessage('ready', (client: Client) => {
      this.handlePlayerReady(client.sessionId);
    });

    // Pause request
    this.onMessage('pause', (client: Client) => {
      if (this.state.status === 'playing') {
        this.pauseGame('Player paused');
      }
    });

    // Resume request
    this.onMessage('resume', (client: Client) => {
      if (this.state.status === 'paused') {
        this.resumeGame();
      }
    });

    // Forfeit
    this.onMessage('forfeit', (client: Client) => {
      this.handleForfeit(client.sessionId);
    });
  }

  private handleInput(sessionId: string, input: PlayerInput): void {
    const player = this.state.players.get(sessionId);
    if (!player || !player.connected) return;

    // Validate input sequence (anti-cheat: prevent replay attacks)
    if (input.sequence <= player.lastInputSequence) {
      return;
    }
    player.lastInputSequence = input.sequence;

    // Validate input values (anti-cheat: ensure boolean values)
    player.inputLeft = !!input.left;
    player.inputRight = !!input.right;
    player.inputJump = !!input.jump;
    player.inputJumpPressed = !!input.jumpPressed;
  }

  private handlePlayerReady(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    player.ready = true;
    console.log(`[GameRoom] Player ${sessionId} is ready`);

    // Check if all players are ready
    const allReady = Array.from(this.state.players.values()).every(p => p.ready);

    if (allReady && this.state.players.size === 2) {
      this.startCountdown();
    }
  }

  private handleForfeit(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    const otherPlayer = Array.from(this.state.players.values()).find(p => p.id !== sessionId);
    if (otherPlayer) {
      this.endGame(otherPlayer.id, otherPlayer.side, 'forfeit');
    }
  }

  // ==================== Reconnection ====================

  private handleReconnection(client: Client, options: JoinOptions): boolean {
    // Check if this is a reconnecting player
    for (const [sessionId, data] of this.state.disconnectedPlayers) {
      if (data.odUserId === options.odUserId) {
        // Clear timeout
        clearTimeout(data.timeout);
        this.state.disconnectedPlayers.delete(sessionId);

        // Find the player in state
        const player = this.state.players.get(sessionId);
        if (player) {
          // Update session ID
          this.state.players.delete(sessionId);
          player.id = client.sessionId;
          player.connected = true;
          this.state.players.set(client.sessionId, player);

          console.log(`[GameRoom] Player ${client.sessionId} reconnected`);

          // Resume game if it was paused
          if (this.state.status === 'paused') {
            this.resumeGame();
          }

          return true;
        }
      }
    }
    return false;
  }

  private handleReconnectionTimeout(sessionId: string): void {
    const data = this.state.disconnectedPlayers.get(sessionId);
    if (!data) return;

    console.log(`[GameRoom] Reconnection timeout for ${sessionId}`);
    this.state.disconnectedPlayers.delete(sessionId);

    // Award win to remaining player
    const remainingPlayer = Array.from(this.state.players.values()).find(
      p => p.id !== sessionId && p.connected
    );

    if (remainingPlayer) {
      this.endGame(remainingPlayer.id, remainingPlayer.side, 'disconnect');
    } else {
      // No players left
      this.state.status = 'finished';
    }
  }

  private handlePlayerLeave(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    // If game is in progress, opponent wins
    if (this.state.status === 'playing' || this.state.status === 'countdown') {
      const opponent = Array.from(this.state.players.values()).find(p => p.id !== sessionId);
      if (opponent) {
        this.endGame(opponent.id, opponent.side, 'disconnect');
      }
    }

    this.state.players.delete(sessionId);

    // If room is empty or no game started, just notify
    if (this.state.status === 'waiting') {
      this.broadcast('opponent_left');
    }
  }

  // ==================== Game Flow ====================

  private startCountdown(): void {
    this.state.status = 'countdown';
    this.state.timer = COUNTDOWN_DURATION;
    this.state.startedAt = Date.now();

    // Initialize ball position
    this.resetBall();

    // Initialize player positions
    this.resetPlayerPositions();

    console.log(`[GameRoom] Starting countdown...`);

    // Countdown timer
    const countdownInterval = this.clock.setInterval(() => {
      this.state.timer--;

      if (this.state.timer <= 0) {
        countdownInterval.clear();
        this.startGame();
      }
    }, 1000);
  }

  private startGame(): void {
    this.state.status = 'playing';
    this.state.timer = 0;
    this.lastTickTime = Date.now();
    this.tickAccumulator = 0;

    console.log(`[GameRoom] Game started!`);

    // Release ball
    this.state.ball.velocityY = 50; // Small initial drop

    // Start game loop
    this.gameLoop = this.clock.setInterval(() => {
      this.tick();
    }, this.fixedDeltaTime);

    // Start match timer
    this.matchTimer = this.clock.setInterval(() => {
      if (this.state.status === 'playing') {
        this.state.matchTime++;
      }
    }, 1000);
  }

  private pauseGame(reason: string): void {
    if (this.state.status !== 'playing') return;

    this.state.status = 'paused';
    console.log(`[GameRoom] Game paused: ${reason}`);

    this.broadcast('game_paused', { reason });
  }

  private resumeGame(): void {
    if (this.state.status !== 'paused') return;

    // Check all players are connected
    const allConnected = Array.from(this.state.players.values()).every(p => p.connected);
    if (!allConnected) {
      return;
    }

    this.state.status = 'playing';
    this.lastTickTime = Date.now();

    console.log(`[GameRoom] Game resumed`);
    this.broadcast('game_resumed');
  }

  private endGame(winnerId: string, winnerSide: 'left' | 'right', reason: string): void {
    this.state.status = 'finished';
    this.state.winner = winnerId;
    this.state.winnerSide = winnerSide;

    // Stop game loop
    if (this.gameLoop) {
      this.gameLoop.clear();
      this.gameLoop = undefined;
    }
    if (this.matchTimer) {
      this.matchTimer.clear();
      this.matchTimer = undefined;
    }

    console.log(`[GameRoom] Game ended - Winner: ${winnerId} (${reason})`);

    this.broadcast('game_over', {
      winnerId,
      winnerSide,
      reason,
      score: {
        player1: this.state.score.player1,
        player2: this.state.score.player2,
      },
      matchTime: this.state.matchTime,
    });

    // TODO: Update rankings, save match to database
  }

  // ==================== Game Loop ====================

  private tick(): void {
    if (this.state.status !== 'playing') return;

    const deltaTime = this.fixedDeltaTime / 1000; // Convert to seconds

    // Update players
    this.state.players.forEach(player => {
      this.updatePlayer(player, deltaTime);
    });

    // Update ball
    this.updateBall(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Check scoring
    this.checkScoring();

    // Clear jump pressed flags
    this.state.players.forEach(player => {
      player.inputJumpPressed = false;
    });
  }

  // ==================== Player Physics ====================

  private updatePlayer(player: PlayerSchema, deltaTime: number): void {
    if (!player.connected) return;

    // Get character stats
    const moveSpeed = ATTRIBUTE_FORMULAS.speed(player.speed);
    const jumpForce = ATTRIBUTE_FORMULAS.jump(player.jump);

    // Horizontal movement
    let velocityX = 0;
    if (player.inputLeft) velocityX -= moveSpeed;
    if (player.inputRight) velocityX += moveSpeed;
    player.velocityX = velocityX;

    // Jump
    if (player.inputJumpPressed && player.isGrounded) {
      player.velocityY = -jumpForce;
      player.isGrounded = false;
      player.isJumping = true;
      player.animation = 'jump';
    }

    // Apply gravity
    if (!player.isGrounded) {
      player.velocityY += PHYSICS.GRAVITY * deltaTime;

      // Switch to fall animation
      if (player.velocityY > 0 && player.animation === 'jump') {
        player.animation = 'fall';
      }
    }

    // Update position
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;

    // Ground collision
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    if (player.y >= groundY) {
      player.y = groundY;
      player.velocityY = 0;
      player.isGrounded = true;
      player.isJumping = false;
      player.animation = Math.abs(player.velocityX) > 10 ? 'run' : 'idle';
    }

    // Court boundaries
    this.clampPlayerPosition(player);

    // Update hit cooldown
    if (player.hitCooldown > 0) {
      player.hitCooldown -= deltaTime * 1000;
      if (player.hitCooldown <= 0) {
        player.hitCooldown = 0;
        player.canHit = true;
      }
    }
  }

  private clampPlayerPosition(player: PlayerSchema): void {
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

  private updateBall(deltaTime: number): void {
    const ball = this.state.ball;

    // Apply gravity
    ball.velocityY += PHYSICS.GRAVITY * deltaTime;

    // Apply spin effect
    if (Math.abs(ball.spin) > 0.1) {
      ball.velocityX += ball.spin * 50 * deltaTime;
      ball.spin *= 0.98; // Decay
    }

    // Update position
    ball.x += ball.velocityX * deltaTime;
    ball.y += ball.velocityY * deltaTime;

    // Clamp velocity
    const maxSpeed = PHYSICS.MAX_BALL_SPEED;
    ball.velocityX = Math.max(-maxSpeed, Math.min(ball.velocityX, maxSpeed));
    ball.velocityY = Math.max(-maxSpeed, Math.min(ball.velocityY, maxSpeed));

    // Wall bounces
    if (ball.x <= PHYSICS.BALL_RADIUS) {
      ball.x = PHYSICS.BALL_RADIUS;
      ball.velocityX = Math.abs(ball.velocityX) * PHYSICS.BALL_BOUNCE;
      ball.spin *= -0.5;
    }
    if (ball.x >= PHYSICS.COURT_WIDTH - PHYSICS.BALL_RADIUS) {
      ball.x = PHYSICS.COURT_WIDTH - PHYSICS.BALL_RADIUS;
      ball.velocityX = -Math.abs(ball.velocityX) * PHYSICS.BALL_BOUNCE;
      ball.spin *= -0.5;
    }

    // Ceiling bounce
    if (ball.y <= PHYSICS.BALL_RADIUS) {
      ball.y = PHYSICS.BALL_RADIUS;
      ball.velocityY = Math.abs(ball.velocityY) * PHYSICS.BALL_BOUNCE;
    }

    // Net collision
    this.checkBallNetCollision();
  }

  private checkBallNetCollision(): void {
    const ball = this.state.ball;
    const radius = PHYSICS.BALL_RADIUS;
    const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
    const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;
    const netTop = PHYSICS.GROUND_Y - PHYSICS.NET_HEIGHT;

    // Only check if ball is at net height
    if (ball.y < netTop - radius || ball.y > PHYSICS.GROUND_Y) {
      return;
    }

    // Check horizontal collision
    if (ball.x + radius > netLeft && ball.x - radius < netRight) {
      if (ball.velocityX > 0) {
        ball.x = netLeft - radius;
        ball.velocityX = -Math.abs(ball.velocityX) * PHYSICS.BALL_BOUNCE * 0.8;
      } else {
        ball.x = netRight + radius;
        ball.velocityX = Math.abs(ball.velocityX) * PHYSICS.BALL_BOUNCE * 0.8;
      }

      // Top of net collision
      if (ball.y - radius < netTop && ball.y > netTop - radius * 2) {
        ball.y = netTop - radius;
        ball.velocityY = -Math.abs(ball.velocityY) * PHYSICS.BALL_BOUNCE * 0.5;
      }
    }
  }

  // ==================== Collisions ====================

  private checkCollisions(): void {
    this.state.players.forEach(player => {
      if (!player.connected || !player.canHit) return;

      const ball = this.state.ball;
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRange = PHYSICS.BALL_RADIUS + 28; // Player hit range

      if (distance < hitRange) {
        this.handlePlayerBallHit(player);
      }
    });
  }

  private handlePlayerBallHit(player: PlayerSchema): void {
    const ball = this.state.ball;

    // Get character stats
    const hitPower = ATTRIBUTE_FORMULAS.power(player.power);
    const controlFactor = ATTRIBUTE_FORMULAS.control(player.control);

    // Calculate hit direction
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dirX = distance > 0 ? dx / distance : 0;
    const dirY = distance > 0 ? dy / distance : -1;

    // Add randomness based on control
    const randomFactor = 1 - controlFactor;
    const randomAngle = this.random.nextCentered() * randomFactor * Math.PI * 0.5;
    const cos = Math.cos(randomAngle);
    const sin = Math.sin(randomAngle);
    const finalDirX = dirX * cos - dirY * sin;
    const finalDirY = dirX * sin + dirY * cos;

    // Calculate new velocity
    let newVelX = finalDirX * hitPower;
    let newVelY = finalDirY * hitPower;

    // Add player momentum
    newVelX += player.velocityX * 0.3;
    newVelY += player.velocityY * 0.3;

    // Ensure ball goes upward if hit from below
    if (dy < 0 && newVelY > -100) {
      newVelY = Math.min(newVelY, -200);
    }

    // Calculate spin based on player movement
    const spin = player.velocityX * 0.01 * (1 + randomFactor);

    // Apply hit
    ball.velocityX = Math.max(-PHYSICS.MAX_BALL_SPEED, Math.min(newVelX, PHYSICS.MAX_BALL_SPEED));
    ball.velocityY = Math.max(-PHYSICS.MAX_BALL_SPEED, Math.min(newVelY, PHYSICS.MAX_BALL_SPEED));
    ball.spin = Math.max(-3, Math.min(spin, 3));
    ball.lastHitBy = player.id;

    // Start hit cooldown
    player.canHit = false;
    player.hitCooldown = HIT_COOLDOWN;
    player.animation = 'hit';

    // Reset animation after hit
    setTimeout(() => {
      if (player.animation === 'hit') {
        player.animation = player.isGrounded ? 'idle' : 'fall';
      }
    }, 100);
  }

  // ==================== Scoring ====================

  private checkScoring(): void {
    const ball = this.state.ball;

    // Ball touched ground
    if (ball.y >= PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS) {
      const scoringSide: 'left' | 'right' = ball.x < PHYSICS.COURT_WIDTH / 2 ? 'right' : 'left';
      this.scorePoint(scoringSide);
    }
  }

  private scorePoint(scoringSide: 'left' | 'right'): void {
    // Update score
    if (scoringSide === 'left') {
      this.state.score.player1++;
    } else {
      this.state.score.player2++;
    }

    // Update player scores
    this.state.players.forEach(player => {
      if (player.side === scoringSide) {
        player.score++;
      }
    });

    // Set serving side
    this.state.servingSide = scoringSide;

    console.log(`[GameRoom] Point scored by ${scoringSide} - Score: ${this.state.score.player1}-${this.state.score.player2}`);

    this.broadcast('point_scored', {
      side: scoringSide,
      score: {
        player1: this.state.score.player1,
        player2: this.state.score.player2,
      },
    });

    // Check win condition
    const maxScore = this.state.mode === 'ranked' ? GAME.RANKED_POINTS : GAME.CASUAL_POINTS;
    const winningPlayer = Array.from(this.state.players.values()).find(p => p.score >= maxScore);

    if (winningPlayer) {
      this.endGame(winningPlayer.id, winningPlayer.side, 'score');
    } else {
      // Pause and reset for next point
      this.state.status = 'point_scored';

      setTimeout(() => {
        if (this.state.status === 'point_scored') {
          this.resetBall();
          this.resetPlayerPositions();
          this.startCountdown();
        }
      }, POINT_SCORED_DELAY);
    }
  }

  // ==================== Reset Functions ====================

  private resetBall(): void {
    const ball = this.state.ball;
    const servingSide = this.state.servingSide;

    ball.x = servingSide === 'left' ? PHYSICS.COURT_WIDTH / 4 : (PHYSICS.COURT_WIDTH * 3) / 4;
    ball.y = 80;
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.spin = 0;
    ball.lastHitBy = '';
  }

  private resetPlayerPositions(): void {
    this.state.players.forEach(player => {
      const startX = player.side === 'left' ? 100 : PHYSICS.COURT_WIDTH - 100;
      player.x = startX;
      player.y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
      player.velocityX = 0;
      player.velocityY = 0;
      player.isGrounded = true;
      player.isJumping = false;
      player.animation = 'idle';
      player.canHit = true;
      player.hitCooldown = 0;
    });
  }

  // ==================== Helper Functions ====================

  private createPlayer(sessionId: string, side: 'left' | 'right', options: JoinOptions): PlayerSchema {
    const player = new PlayerSchema();
    player.id = sessionId;
    player.odUserId = options.odUserId || '';
    player.username = options.username || `Player ${side === 'left' ? 1 : 2}`;
    player.side = side;
    player.characterId = options.characterId || 'nova';

    // Set initial position
    const startX = side === 'left' ? 100 : PHYSICS.COURT_WIDTH - 100;
    player.x = startX;
    player.y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;

    // Load character stats
    const charKey = player.characterId.toUpperCase() as keyof typeof CHARACTERS;
    const charData = CHARACTERS[charKey] || CHARACTERS.NOVA;
    player.speed = charData.speed;
    player.jump = charData.jump;
    player.power = charData.power;
    player.control = charData.control;

    return player;
  }

  private getPlayersSummary(): Array<{ id: string; username: string; side: string; characterId: string }> {
    return Array.from(this.state.players.values()).map(p => ({
      id: p.id,
      username: p.username,
      side: p.side,
      characterId: p.characterId,
    }));
  }
}
