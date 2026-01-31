import Phaser from 'phaser';
import {
  PHYSICS,
  GAME,
  UI_SAFE,
  Character,
  type CharacterId,
  type GameMode,
} from '@spike-rivals/shared';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { BackgroundManager } from '../backgrounds';
import { HUD } from '../ui/hud';
import { PauseMenu } from '../ui/pause-menu';
import { GameOverDialog } from '../ui/game-over-dialog';

type GameState = 'READY' | 'COUNTDOWN' | 'PLAYING' | 'POINT_SCORED' | 'GAME_OVER' | 'PAUSED';

interface GameSceneData {
  mode: GameMode;
  characterId?: CharacterId;
  backgroundId?: string;
}

interface PlayerObject {
  sprite: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Rectangle;
  body: Phaser.Physics.Arcade.Body;
  side: 'left' | 'right';
  character: Character;
  isJumping: boolean;
}

export class GameScene extends Phaser.Scene {
  // Game state
  private gameState: GameState = 'READY';
  private mode: GameMode = 'cpu';
  private score = { left: 0, right: 0 };
  private servingSide: 'left' | 'right' = 'left';
  private winningScore = GAME.CASUAL_POINTS;

  // Entities
  private player1!: PlayerObject;
  private player2!: PlayerObject;
  private ball!: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Arc;
  private ballBody!: Phaser.Physics.Arcade.Body;
  private net!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.Sprite;

  // Managers
  private backgroundManager!: BackgroundManager;
  private hud!: HUD;
  private pauseMenu!: PauseMenu;
  private gameOverDialog!: GameOverDialog;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private pauseKey!: Phaser.Input.Keyboard.Key;

  // Touch controls
  private touchControls = { left: false, right: false, jump: false };

  // Timing
  private countdownTimer = 3;
  private pointScoredTimer = 0;

  // Character data
  private selectedCharacterId: CharacterId = 'nova';

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.mode = data.mode || 'cpu';
    this.selectedCharacterId = data.characterId || 'nova';
    this.score = { left: 0, right: 0 };
    this.servingSide = 'left';
    this.gameState = 'READY';
    this.winningScore = this.mode === 'ranked' ? GAME.RANKED_POINTS : GAME.CASUAL_POINTS;
  }

  create(): void {
    // Use ENVELOP mode for gameplay to fill screen (menu uses FIT)
    this.scale.scaleMode = Phaser.Scale.ENVELOP;
    this.scale.refresh();

    // Setup physics world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Background
    this.backgroundManager = new BackgroundManager(this);
    this.backgroundManager.loadBackground('neon-district');

    // Create ground (invisible physics body)
    this.createGround();

    // Create net
    this.createNet();

    // Create players
    this.createPlayers();

    // Create ball
    this.createBall();

    // Setup collisions
    this.setupCollisions();

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();

    // Start countdown
    this.startCountdown();
  }

  private createGround(): void {
    // Visual ground
    this.add.rectangle(GAME_WIDTH / 2, PHYSICS.GROUND_Y + 20, GAME_WIDTH, 40, 0x333366);

    // Physics ground (static)
    this.ground = this.physics.add.sprite(GAME_WIDTH / 2, PHYSICS.GROUND_Y + 5, '__DEFAULT');
    this.ground.setVisible(false);
    this.ground.body.setSize(GAME_WIDTH, 10);
    this.ground.setImmovable(true);
    (this.ground.body as Phaser.Physics.Arcade.Body).allowGravity = false;
  }

  private createNet(): void {
    const netX = GAME_WIDTH / 2;
    const netY = PHYSICS.GROUND_Y - PHYSICS.NET_HEIGHT / 2;

    // Visual net
    const netVisual = this.add.rectangle(netX, netY, PHYSICS.NET_WIDTH, PHYSICS.NET_HEIGHT, 0xffffff);

    // Physics net (collision body slightly wider than visual for fair gameplay)
    this.net = this.physics.add.sprite(netX, netY, '__DEFAULT');
    this.net.setVisible(false);
    this.net.body.setSize(PHYSICS.NET_COLLISION_WIDTH, PHYSICS.NET_HEIGHT);
    this.net.setImmovable(true);
    (this.net.body as Phaser.Physics.Arcade.Body).allowGravity = false;
  }

  private createPlayers(): void {
    const p1Char = Character.fromId(this.selectedCharacterId);
    const p2Char = Character.fromId('nova'); // CPU always uses Nova for now

    // Player 1 (left side)
    const p1TextureKey = `char-${p1Char.id}`;
    let p1Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

    if (this.textures.exists(p1TextureKey)) {
      // Use character sprite
      p1Sprite = this.add.sprite(100, PHYSICS.GROUND_Y, p1TextureKey);
      p1Sprite.setOrigin(0.5, 1); // Bottom center origin for proper ground alignment
    } else {
      // Fallback to placeholder rectangle
      p1Sprite = this.add.rectangle(
        100,
        PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2,
        PHYSICS.PLAYER_WIDTH,
        PHYSICS.PLAYER_HEIGHT,
        0x00ff88
      );
    }
    this.physics.add.existing(p1Sprite);
    const p1Body = p1Sprite.body as Phaser.Physics.Arcade.Body;
    p1Body.setSize(PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT);
    p1Body.setOffset(
      p1Sprite instanceof Phaser.GameObjects.Sprite ? -PHYSICS.PLAYER_WIDTH / 2 : 0,
      p1Sprite instanceof Phaser.GameObjects.Sprite ? -PHYSICS.PLAYER_HEIGHT : 0
    );
    p1Body.setCollideWorldBounds(true);
    p1Body.setBounce(0);

    this.player1 = {
      sprite: p1Sprite as unknown as Phaser.Physics.Arcade.Sprite,
      body: p1Body,
      side: 'left',
      character: p1Char,
      isJumping: false,
    };

    // Player 2 (right side)
    const p2TextureKey = `char-${p2Char.id}`;
    let p2Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

    if (this.textures.exists(p2TextureKey)) {
      // Use character sprite
      p2Sprite = this.add.sprite(GAME_WIDTH - 100, PHYSICS.GROUND_Y, p2TextureKey);
      p2Sprite.setOrigin(0.5, 1);
      p2Sprite.setFlipX(true); // Face left for right-side player
    } else {
      // Fallback to placeholder rectangle
      p2Sprite = this.add.rectangle(
        GAME_WIDTH - 100,
        PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2,
        PHYSICS.PLAYER_WIDTH,
        PHYSICS.PLAYER_HEIGHT,
        0xff6688
      );
    }
    this.physics.add.existing(p2Sprite);
    const p2Body = p2Sprite.body as Phaser.Physics.Arcade.Body;
    p2Body.setSize(PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT);
    p2Body.setOffset(
      p2Sprite instanceof Phaser.GameObjects.Sprite ? -PHYSICS.PLAYER_WIDTH / 2 : 0,
      p2Sprite instanceof Phaser.GameObjects.Sprite ? -PHYSICS.PLAYER_HEIGHT : 0
    );
    p2Body.setCollideWorldBounds(true);
    p2Body.setBounce(0);

    this.player2 = {
      sprite: p2Sprite as unknown as Phaser.Physics.Arcade.Sprite,
      body: p2Body,
      side: 'right',
      character: p2Char,
      isJumping: false,
    };
  }

  private createBall(): void {
    const ballX = this.servingSide === 'left' ? GAME_WIDTH / 4 : (GAME_WIDTH * 3) / 4;

    // Visual ball
    const ballVisual = this.add.circle(ballX, 80, PHYSICS.BALL_RADIUS, 0xffff00);
    this.physics.add.existing(ballVisual);

    this.ball = ballVisual as unknown as Phaser.Physics.Arcade.Sprite;
    this.ballBody = ballVisual.body as Phaser.Physics.Arcade.Body;
    this.ballBody.setCircle(PHYSICS.BALL_RADIUS);
    this.ballBody.setBounce(PHYSICS.BALL_BOUNCE);
    this.ballBody.setCollideWorldBounds(true);
    this.ballBody.setMaxVelocity(PHYSICS.MAX_BALL_SPEED, PHYSICS.MAX_BALL_SPEED);
  }

  private setupCollisions(): void {
    // Ball vs players
    this.physics.add.overlap(
      this.ball,
      this.player1.sprite,
      () => this.handlePlayerBallCollision(this.player1),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.ball,
      this.player2.sprite,
      () => this.handlePlayerBallCollision(this.player2),
      undefined,
      this
    );

    // Ball vs net
    this.physics.add.collider(this.ball, this.net);

    // Players vs ground (to detect landing)
    this.physics.add.collider(this.player1.sprite, this.ground, () => {
      this.player1.isJumping = false;
    });
    this.physics.add.collider(this.player2.sprite, this.ground, () => {
      this.player2.isJumping = false;
    });
  }

  private handlePlayerBallCollision(player: PlayerObject): void {
    if (this.gameState !== 'PLAYING') return;

    const hitPower = player.character.getHitPower();
    const controlFactor = player.character.getControlFactor();

    // Calculate hit direction based on relative positions
    const dx = this.ball.x - player.sprite.x;
    const dy = this.ball.y - player.sprite.y;
    const angle = Math.atan2(dy, dx);

    // Add randomness based on control (less control = more random)
    const randomAngle = (Math.random() - 0.5) * (1 - controlFactor) * 0.8;
    const finalAngle = angle + randomAngle;

    // Apply velocity
    this.ballBody.setVelocity(
      Math.cos(finalAngle) * hitPower,
      Math.sin(finalAngle) * hitPower
    );

    // Visual feedback
    this.tweens.add({
      targets: this.ball,
      scaleX: 1.3,
      scaleY: 0.7,
      duration: 50,
      yoyo: true,
    });
  }

  private createUI(): void {
    // HUD
    this.hud = new HUD(this);
    this.hud.updateScore(this.score.left, this.score.right);

    // Pause menu
    this.pauseMenu = new PauseMenu(
      this,
      () => this.resumeGame(),
      () => this.quitToMenu()
    );

    // Game over dialog
    this.gameOverDialog = new GameOverDialog(
      this,
      () => this.restartGame(),
      () => this.quitToMenu()
    );

    // Mode indicator (with safe margin for ENVELOP scaling)
    this.add.text(UI_SAFE.LEFT, UI_SAFE.TOP, `Mode: ${this.mode.toUpperCase()}`, {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#666666',
    });

    // Controls hint (with safe margin for ENVELOP scaling)
    this.add.text(UI_SAFE.LEFT, GAME_HEIGHT - UI_SAFE.BOTTOM, 'Arrow/WASD: Move | Space/Up: Jump | ESC: Pause', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#444444',
    });
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Pause toggle
    this.pauseKey.on('down', () => {
      if (this.gameState === 'PLAYING') {
        this.pauseGame();
      } else if (this.gameState === 'PAUSED') {
        this.resumeGame();
      }
    });

    // Touch controls
    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = pointer.x;
      const third = GAME_WIDTH / 3;

      if (x < third) {
        this.touchControls.left = true;
      } else if (x > third * 2) {
        this.touchControls.right = true;
      } else {
        this.touchControls.jump = true;
      }
    });

    this.input.on('pointerup', () => {
      this.touchControls = { left: false, right: false, jump: false };
    });
  }

  private startCountdown(): void {
    this.gameState = 'COUNTDOWN';
    this.countdownTimer = 3;

    // Freeze ball
    this.ballBody.setVelocity(0, 0);
    this.ballBody.setAllowGravity(false);

    // Show countdown text
    const countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '3', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(100);

    // Countdown timer
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdownTimer--;
        if (this.countdownTimer > 0) {
          countdownText.setText(this.countdownTimer.toString());
          this.tweens.add({
            targets: countdownText,
            scale: 1.5,
            duration: 100,
            yoyo: true,
          });
        } else {
          countdownText.setText('GO!');
          this.tweens.add({
            targets: countdownText,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              countdownText.destroy();
              this.startPlaying();
            },
          });
        }
      },
    });
  }

  private startPlaying(): void {
    this.gameState = 'PLAYING';
    this.ballBody.setAllowGravity(true);
    this.ballBody.setVelocity(0, 50); // Small initial drop
  }

  update(time: number, delta: number): void {
    if (this.gameState === 'PAUSED' || this.gameState === 'GAME_OVER') {
      return;
    }

    // Update background parallax (optional)
    this.backgroundManager.update(0);

    if (this.gameState === 'PLAYING') {
      // Handle player input
      this.handlePlayer1Input(delta);

      // Handle CPU or Player 2
      if (this.mode === 'cpu') {
        this.handleCPU(delta);
      }

      // Check for scoring
      this.checkScoring();

      // Clamp players to their sides
      this.clampPlayerPositions();
    }

    if (this.gameState === 'POINT_SCORED') {
      this.pointScoredTimer -= delta;
      if (this.pointScoredTimer <= 0) {
        this.resetForNextPoint();
      }
    }
  }

  private handlePlayer1Input(delta: number): void {
    const player = this.player1;
    const moveSpeed = player.character.getMovementSpeed();
    const jumpForce = player.character.getJumpForce();

    // Movement
    let velocityX = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown || this.touchControls.left) {
      velocityX = -moveSpeed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown || this.touchControls.right) {
      velocityX = moveSpeed;
    }
    player.body.setVelocityX(velocityX);

    // Jump
    const wantsJump = this.cursors.up.isDown || this.wasd.W.isDown || this.spaceKey.isDown || this.touchControls.jump;
    if (wantsJump && !player.isJumping && player.body.blocked.down) {
      player.body.setVelocityY(-jumpForce);
      player.isJumping = true;
    }

    // Check if landed
    if (player.body.blocked.down) {
      player.isJumping = false;
    }
  }

  private handleCPU(delta: number): void {
    const cpu = this.player2;
    const moveSpeed = cpu.character.getMovementSpeed() * 0.8; // Slightly slower than max
    const jumpForce = cpu.character.getJumpForce();
    const courtMiddle = GAME_WIDTH / 2;

    // Only react if ball is on CPU's side or coming towards it
    const ballOnMySide = this.ball.x > courtMiddle;
    const ballComingToMe = this.ballBody.velocity.x > 0;

    if (ballOnMySide || ballComingToMe) {
      // Move towards ball
      const targetX = this.ball.x;
      const dx = targetX - cpu.sprite.x;

      if (Math.abs(dx) > 15) {
        cpu.body.setVelocityX(dx > 0 ? moveSpeed : -moveSpeed);
      } else {
        cpu.body.setVelocityX(0);
      }

      // Jump if ball is above and close
      const shouldJump =
        ballOnMySide &&
        this.ball.y < PHYSICS.GROUND_Y - 60 &&
        Math.abs(this.ball.x - cpu.sprite.x) < 50 &&
        !cpu.isJumping &&
        cpu.body.blocked.down;

      if (shouldJump) {
        cpu.body.setVelocityY(-jumpForce);
        cpu.isJumping = true;
      }
    } else {
      // Return to center of my side
      const homeX = courtMiddle + (GAME_WIDTH - courtMiddle) / 2;
      const dx = homeX - cpu.sprite.x;

      if (Math.abs(dx) > 20) {
        cpu.body.setVelocityX(dx > 0 ? moveSpeed * 0.5 : -moveSpeed * 0.5);
      } else {
        cpu.body.setVelocityX(0);
      }
    }

    // Check if landed
    if (cpu.body.blocked.down) {
      cpu.isJumping = false;
    }
  }

  private clampPlayerPositions(): void {
    const courtMiddle = GAME_WIDTH / 2;
    const netHalfWidth = PHYSICS.NET_COLLISION_WIDTH / 2;
    const playerHalfWidth = PHYSICS.PLAYER_WIDTH / 2;

    // Player 1 (left side)
    if (this.player1.sprite.x < playerHalfWidth) {
      this.player1.sprite.x = playerHalfWidth;
    }
    if (this.player1.sprite.x > courtMiddle - netHalfWidth - playerHalfWidth) {
      this.player1.sprite.x = courtMiddle - netHalfWidth - playerHalfWidth;
    }

    // Player 2 (right side)
    if (this.player2.sprite.x < courtMiddle + netHalfWidth + playerHalfWidth) {
      this.player2.sprite.x = courtMiddle + netHalfWidth + playerHalfWidth;
    }
    if (this.player2.sprite.x > GAME_WIDTH - playerHalfWidth) {
      this.player2.sprite.x = GAME_WIDTH - playerHalfWidth;
    }
  }

  private checkScoring(): void {
    // Ball touched ground
    if (this.ball.y >= PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS) {
      const courtMiddle = GAME_WIDTH / 2;

      if (this.ball.x < courtMiddle) {
        // Ball on left side = right player scores
        this.scorePoint('right');
      } else {
        // Ball on right side = left player scores
        this.scorePoint('left');
      }
    }
  }

  private scorePoint(scorer: 'left' | 'right'): void {
    this.gameState = 'POINT_SCORED';
    this.pointScoredTimer = 1500; // 1.5 seconds pause

    // Update score
    this.score[scorer]++;
    this.hud.updateScore(this.score.left, this.score.right);
    this.hud.animateScore(scorer);

    // Set serving side to scorer
    this.servingSide = scorer;

    // Stop ball
    this.ballBody.setVelocity(0, 0);
    this.ballBody.setAllowGravity(false);

    // Show point text
    const pointText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      scorer === 'left' ? 'PLAYER 1 SCORES!' : (this.mode === 'cpu' ? 'CPU SCORES!' : 'PLAYER 2 SCORES!'),
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: scorer === 'left' ? '#00ff88' : '#ff6688',
      }
    ).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: pointText,
      alpha: 0,
      y: pointText.y - 30,
      duration: 1000,
      delay: 500,
      onComplete: () => pointText.destroy(),
    });

    // Check for game over
    if (this.score[scorer] >= this.winningScore) {
      this.endGame(scorer);
    }
  }

  private resetForNextPoint(): void {
    // Reset ball position
    const ballX = this.servingSide === 'left' ? GAME_WIDTH / 4 : (GAME_WIDTH * 3) / 4;
    this.ball.x = ballX;
    this.ball.y = 80;
    this.ballBody.setVelocity(0, 0);

    // Reset player positions
    this.player1.sprite.x = 100;
    this.player1.sprite.y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    this.player1.body.setVelocity(0, 0);

    this.player2.sprite.x = GAME_WIDTH - 100;
    this.player2.sprite.y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    this.player2.body.setVelocity(0, 0);

    // Start new countdown
    this.startCountdown();
  }

  private endGame(winner: 'left' | 'right'): void {
    this.gameState = 'GAME_OVER';

    // Stop all physics
    this.ballBody.setVelocity(0, 0);
    this.ballBody.setAllowGravity(false);
    this.player1.body.setVelocity(0, 0);
    this.player2.body.setVelocity(0, 0);

    // Show game over dialog
    this.gameOverDialog.show(winner, this.score.left, this.score.right);
  }

  private pauseGame(): void {
    this.gameState = 'PAUSED';
    this.physics.pause();
    this.pauseMenu.show();
  }

  private resumeGame(): void {
    this.gameState = 'PLAYING';
    this.physics.resume();
    this.pauseMenu.hide();
  }

  private restartGame(): void {
    this.scene.restart({ mode: this.mode, characterId: this.selectedCharacterId });
  }

  private quitToMenu(): void {
    this.backgroundManager.destroy();
    this.scene.start('MenuScene');
  }
}
