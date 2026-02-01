import Phaser from 'phaser';
import {
  PHYSICS,
  GAME,
  UI_SAFE,
  Character,
  type CharacterId,
  type GameMode,
  type GameState as ServerGameState,
} from '@spike-rivals/shared';
import type { Room } from 'colyseus.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { BackgroundManager } from '../backgrounds';
import { HUD } from '../ui/hud';
import { PauseMenu } from '../ui/pause-menu';
import { GameOverDialog } from '../ui/game-over-dialog';
import {
  colyseusClient,
  createPredictionManager,
  createNetworkStateManager,
  type PredictionManager,
  type NetworkStateManager,
} from '../network';

type LocalGameState = 'READY' | 'COUNTDOWN' | 'PLAYING' | 'POINT_SCORED' | 'GAME_OVER' | 'PAUSED';

const IS_DEV = import.meta.env.DEV;
const AUTO_RETRY_BASE_MS = 1500;
const AUTO_RETRY_MAX_MS = 15000;
const AUTO_RETRY_MAX_ATTEMPTS = 5;

interface GameSceneData {
  mode: GameMode;
  characterId?: CharacterId;
  backgroundId?: string;
}

interface PlayerObject {
  sprite: ArcadeSpriteOrRect;
  body: Phaser.Physics.Arcade.Body;
  side: 'left' | 'right';
  character: Character;
  isJumping: boolean;
}

type ArcadeBody = Phaser.Physics.Arcade.Body;
type ArcadeSpriteOrRect = (Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle) & { body: ArcadeBody };
type ArcadeArc = Phaser.GameObjects.Arc & { body: ArcadeBody };

const withArcadeBody = <T extends Phaser.GameObjects.GameObject>(obj: T): T & { body: ArcadeBody } =>
  obj as T & { body: ArcadeBody };

export class GameScene extends Phaser.Scene {
  // Game state
  private gameState: LocalGameState = 'READY';
  private mode: GameMode = 'cpu';
  private score = { left: 0, right: 0 };
  private servingSide: 'left' | 'right' = 'left';
  private winningScore = GAME.CASUAL_POINTS;

  // Entities
  private player1!: PlayerObject;
  private player2!: PlayerObject;
  private ball!: ArcadeArc;
  private ballBody!: Phaser.Physics.Arcade.Body;
  private net!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.Sprite;

  // Managers
  private backgroundManager!: BackgroundManager;
  private hud!: HUD;
  private pauseMenu!: PauseMenu;
  private gameOverDialog!: GameOverDialog;
  private predictionManager: PredictionManager | null = null;
  private predictionInitialized = false;
  private predictionOpponents = new Set<string>();
  private onlineRoom: Room<ServerGameState> | null = null;
  private lastJumpHeld = false;
  private serverCountdownText: Phaser.GameObjects.Text | null = null;
  private networkStateManager: NetworkStateManager | null = null;
  private localSide: 'left' | 'right' | null = null;
  private serverTick = 0;
  private connectionErrorDialog: Phaser.GameObjects.Container | null = null;
  private connectionErrorText: Phaser.GameObjects.Text | null = null;
  private connectionErrorActive = false;
  private retryCount = 0;
  private retryTimer: Phaser.Time.TimerEvent | null = null;
  private isConnecting = false;
  private connectionText: Phaser.GameObjects.Text | null = null;

  // Input
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private pauseKey: Phaser.Input.Keyboard.Key | null = null;

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
    this.predictionManager = null;
    this.predictionInitialized = false;
    this.predictionOpponents.clear();
    this.onlineRoom = null;
    this.lastJumpHeld = false;
    this.networkStateManager = null;
    this.localSide = null;
    this.serverTick = 0;
    this.connectionErrorDialog = null;
    this.connectionErrorText = null;
    this.connectionErrorActive = false;
    this.retryCount = 0;
    this.retryTimer = null;
    this.isConnecting = false;
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.mode !== 'cpu') {
        colyseusClient.leave();
      }
    });

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

    // Online prediction seed wiring + connection
    this.setupOnlinePrediction();
    if (this.mode === 'cpu') {
      // Start countdown immediately for offline
      this.startCountdown();
    } else {
      void this.setupOnlineConnection();
    }
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
    const p1Y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2; // Center Y position

    if (this.textures.exists(p1TextureKey)) {
      // Use character sprite - position at center of collision area
      p1Sprite = this.add.sprite(100, p1Y, p1TextureKey);
      // Default origin (0.5, 0.5) centers the sprite
    } else {
      // Fallback to placeholder rectangle
      p1Sprite = this.add.rectangle(
        100,
        p1Y,
        PHYSICS.PLAYER_WIDTH,
        PHYSICS.PLAYER_HEIGHT,
        0x00ff88
      );
    }
    this.physics.add.existing(p1Sprite);
    const p1SpriteWithBody = withArcadeBody(p1Sprite);
    const p1Body = p1SpriteWithBody.body;
    p1Body.setSize(PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT);
    // For sprites, offset the body to center it on the sprite
    if (p1Sprite instanceof Phaser.GameObjects.Sprite) {
      const frameWidth = p1Sprite.width;
      const frameHeight = p1Sprite.height;
      p1Body.setOffset(
        (frameWidth - PHYSICS.PLAYER_WIDTH) / 2,
        (frameHeight - PHYSICS.PLAYER_HEIGHT) / 2
      );
    }
    p1Body.setCollideWorldBounds(true);
    p1Body.setBounce(0);

    this.player1 = {
      sprite: p1SpriteWithBody,
      body: p1Body,
      side: 'left',
      character: p1Char,
      isJumping: false,
    };

    // Player 2 (right side)
    const p2TextureKey = `char-${p2Char.id}`;
    let p2Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
    const p2Y = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2; // Center Y position

    if (this.textures.exists(p2TextureKey)) {
      // Use character sprite - position at center of collision area
      p2Sprite = this.add.sprite(GAME_WIDTH - 100, p2Y, p2TextureKey);
      p2Sprite.setFlipX(true); // Face left for right-side player
    } else {
      // Fallback to placeholder rectangle
      p2Sprite = this.add.rectangle(
        GAME_WIDTH - 100,
        p2Y,
        PHYSICS.PLAYER_WIDTH,
        PHYSICS.PLAYER_HEIGHT,
        0xff6688
      );
    }
    this.physics.add.existing(p2Sprite);
    const p2SpriteWithBody = withArcadeBody(p2Sprite);
    const p2Body = p2SpriteWithBody.body;
    p2Body.setSize(PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT);
    // For sprites, offset the body to center it on the sprite
    if (p2Sprite instanceof Phaser.GameObjects.Sprite) {
      const frameWidth = p2Sprite.width;
      const frameHeight = p2Sprite.height;
      p2Body.setOffset(
        (frameWidth - PHYSICS.PLAYER_WIDTH) / 2,
        (frameHeight - PHYSICS.PLAYER_HEIGHT) / 2
      );
    }
    p2Body.setCollideWorldBounds(true);
    p2Body.setBounce(0);

    this.player2 = {
      sprite: p2SpriteWithBody,
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

    const ballWithBody = withArcadeBody(ballVisual);
    this.ball = ballWithBody;
    this.ballBody = ballWithBody.body;
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

    // Visual feedback - alpha pulse (pixel-safe)
    this.tweens.add({
      targets: this.ball,
      alpha: 0.7,
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
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = {
        W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.pauseKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      // Pause toggle
      this.pauseKey.on('down', () => {
        if (this.mode !== 'cpu') {
          return;
        }
        if (this.gameState === 'PLAYING') {
          this.pauseGame();
        } else if (this.gameState === 'PAUSED') {
          this.resumeGame();
        }
      });
    }

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

  private setupOnlinePrediction(): void {
    if (this.mode === 'cpu') return;
    this.predictionManager = createPredictionManager();
    this.networkStateManager = createNetworkStateManager();
    colyseusClient.onSeed((seed) => {
      this.predictionManager?.setSeed(seed);
      this.showConnectionStatus('SEED SYNCED', '#00ff88', 800);
    });
    this.predictionManager.setInputSendCallback((input, tick) => {
      colyseusClient.sendInput({
        left: input.left,
        right: input.right,
        jump: input.jump,
        jumpPressed: input.jumpPressed ?? false,
        sequence: tick,
      });
    });
  }

  private async setupOnlineConnection(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.showConnectionStatus('CONNECTING...', '#00ff88');
    this.hideConnectionError();
    this.clearAutoRetry();

    try {
      let room = null;
      if (this.mode === 'quick') {
        room = await colyseusClient.quickMatch();
      } else if (this.mode === 'ranked') {
        room = await colyseusClient.rankedMatch();
      } else if (this.mode === 'private') {
        room = await colyseusClient.privateRoom();
      } else {
        room = await colyseusClient.joinOrCreate('game_room', { mode: this.mode });
      }

      if (room) {
        this.onlineRoom = room;
        this.networkStateManager?.setLocalPlayerId(room.sessionId);
        room.onStateChange((state) => this.handleServerState(state));
        room.onLeave(() => {
          this.showConnectionStatus('DISCONNECTED', '#ff6688');
          this.showConnectionError('Connection lost');
          this.scheduleAutoRetry('Reconnecting');
        });
        room.onError(() => {
          this.showConnectionStatus('CONNECTION ERROR', '#ff6688');
          this.showConnectionError('Connection error');
          this.scheduleAutoRetry('Reconnecting');
        });
        colyseusClient.sendReady();
        if (IS_DEV) {
          console.log(`Connected to room ${room.roomId} (${room.name})`);
        }
      }
      this.showConnectionStatus('CONNECTED', '#00ff88', 800);
      this.hideConnectionError();
      this.isConnecting = false;
      this.retryCount = 0;
      this.physics.pause();
    } catch (error) {
      if (IS_DEV) {
        console.error('Failed to connect to room:', error);
      }
      this.showConnectionStatus('CONNECT FAILED', '#ff6688');
      this.showConnectionError('Unable to connect');
      this.scheduleAutoRetry('Retrying');
      this.isConnecting = false;
    }
  }

  private showConnectionStatus(message: string, color: string, autoHideMs = 0): void {
    if (!IS_DEV) return;
    if (!this.connectionText) {
      this.connectionText = this.add.text(GAME_WIDTH / 2, 30, message, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color,
      }).setOrigin(0.5);
    } else {
      this.connectionText.setText(message);
      this.connectionText.setColor(color);
      this.connectionText.setVisible(true);
    }

    if (autoHideMs > 0) {
      this.time.delayedCall(autoHideMs, () => {
        this.connectionText?.setVisible(false);
      });
    }
  }

  private showConnectionError(message: string): void {
    this.connectionErrorActive = true;

    if (!this.connectionErrorDialog) {
      this.connectionErrorDialog = this.add.container(0, 0).setDepth(1000);

      const overlay = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.8
      );
      this.connectionErrorDialog.add(overlay);

      const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'CONNECTION ISSUE', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.connectionErrorDialog.add(title);

      this.connectionErrorText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 15, message, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ff6688',
      }).setOrigin(0.5);
      this.connectionErrorDialog.add(this.connectionErrorText);

      const retryBtn = this.createDialogButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, 'RETRY', () => {
        this.hideConnectionError();
        this.retryCount = 0;
        void this.setupOnlineConnection();
      });
      this.connectionErrorDialog.add(retryBtn);

      const quitBtn = this.createDialogButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, 'QUIT', () => {
        this.scene.start('MenuScene', { notice: 'Online unavailable — switched to offline.' });
      });
      this.connectionErrorDialog.add(quitBtn);
    } else if (this.connectionErrorText) {
      this.connectionErrorText.setText(message);
    }

    this.connectionErrorDialog.setVisible(true);
  }

  private hideConnectionError(): void {
    this.connectionErrorActive = false;
    this.connectionErrorDialog?.setVisible(false);
  }

  private scheduleAutoRetry(prefix: string): void {
    if (this.mode === 'cpu') return;
    if (this.retryCount >= AUTO_RETRY_MAX_ATTEMPTS) return;

    const delay = Math.min(
      AUTO_RETRY_MAX_MS,
      AUTO_RETRY_BASE_MS * Math.pow(2, this.retryCount)
    );
    const seconds = Math.ceil(delay / 1000);
    this.retryCount += 1;

    if (this.connectionErrorText) {
      this.connectionErrorText.setText(`${prefix}. Retrying in ${seconds}s...`);
    }

    this.clearAutoRetry();
    this.retryTimer = this.time.delayedCall(delay, () => {
      void this.setupOnlineConnection();
    });
  }

  private clearAutoRetry(): void {
    if (this.retryTimer) {
      this.retryTimer.remove(false);
      this.retryTimer = null;
    }
  }

  private createDialogButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, text, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 16, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#4444aa' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#333366' }));
    btn.on('pointerdown', onClick);

    return btn;
  }

  private handleServerState(state: ServerGameState): void {
    this.serverTick += 1;
    this.networkStateManager?.onServerState(state.players, state.ball, Date.now());
    this.predictionManager?.onServerState({
      players: state.players,
      ball: state.ball,
      tick: this.serverTick,
    });
    this.applyServerScore(state);
    this.applyServerStatus(state);
    this.initializePredictionFromState(state);
  }

  private applyServerScore(state: ServerGameState): void {
    if (!state.score) return;
    this.hud.updateScore(state.score.player1, state.score.player2);
  }

  private applyServerStatus(state: ServerGameState): void {
    if (state.status === 'countdown') {
      const timer = state.timer ?? 0;
      this.showServerCountdown(timer);
    } else {
      this.hideServerCountdown();
    }

    if (state.status === 'finished' && state.winnerSide) {
      this.gameState = 'GAME_OVER';
      const p1 = state.score?.player1 ?? 0;
      const p2 = state.score?.player2 ?? 0;
      this.gameOverDialog.show(state.winnerSide, p1, p2);
    }
  }

  private showServerCountdown(timer: number): void {
    if (!this.serverCountdownText) {
      this.serverCountdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `${timer}`, {
        fontSize: '48px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(100);
    } else {
      this.serverCountdownText.setText(timer.toString());
      this.serverCountdownText.setVisible(true);
    }
  }

  private hideServerCountdown(): void {
    this.serverCountdownText?.setVisible(false);
  }

  private initializePredictionFromState(state: ServerGameState): void {
    if (!this.predictionManager || !this.onlineRoom) return;
    const localId = this.onlineRoom.sessionId;
    const localPlayer = state.players.get(localId);
    if (!localPlayer) return;

    if (!this.predictionInitialized) {
      this.localSide = localPlayer.side;
      this.predictionManager.initialize(
        localId,
        localPlayer.characterId as CharacterId,
        localPlayer.side,
        {
          speed: localPlayer.speed ?? 5,
          jump: localPlayer.jump ?? 5,
          power: localPlayer.power ?? 5,
          control: localPlayer.control ?? 5,
        }
      );
      this.predictionInitialized = true;
    }

    state.players.forEach((player, id) => {
      if (id === localId) return;
      if (this.predictionOpponents.has(id)) return;
      this.predictionOpponents.add(id);
      this.predictionManager?.addOpponent(
        id,
        player.characterId as CharacterId,
        player.side,
        {
          speed: player.speed ?? 5,
          jump: player.jump ?? 5,
          power: player.power ?? 5,
          control: player.control ?? 5,
        }
      );
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

    if (this.mode !== 'cpu') {
      this.predictionManager?.update(delta);
      this.handleOnlineInput();
      this.renderOnlineState();
      return;
    }

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

  private handleOnlineInput(): void {
    if (!this.predictionManager || !this.predictionInitialized || this.connectionErrorActive) return;

    const left = (this.cursors?.left?.isDown ?? false) || (this.wasd?.A.isDown ?? false) || this.touchControls.left;
    const right = (this.cursors?.right?.isDown ?? false) || (this.wasd?.D.isDown ?? false) || this.touchControls.right;
    const jumpHeld =
      (this.cursors?.up?.isDown ?? false) ||
      (this.wasd?.W.isDown ?? false) ||
      (this.spaceKey?.isDown ?? false) ||
      this.touchControls.jump;

    const jumpPressed = jumpHeld && !this.lastJumpHeld;
    this.lastJumpHeld = jumpHeld;

    this.predictionManager.onLocalInput({
      left,
      right,
      jump: jumpHeld,
      jumpPressed,
    });
  }

  private renderOnlineState(): void {
    if (!this.predictionManager || !this.networkStateManager || !this.localSide) return;

    const localPos = this.predictionManager.getLocalPlayerPosition();
    const localTarget = this.localSide === 'left' ? this.player1 : this.player2;
    const opponentTarget = this.localSide === 'left' ? this.player2 : this.player1;

    if (localPos) {
      localTarget.sprite.x = localPos.x;
      localTarget.sprite.y = localPos.y;
    }

    const now = Date.now();
    const opponentState = this.networkStateManager.getOpponentState(now);
    if (opponentState) {
      opponentTarget.sprite.x = opponentState.x;
      opponentTarget.sprite.y = opponentState.y;
    }

    const ballState = this.networkStateManager.getBallState(now);
    if (ballState) {
      this.ball.x = ballState.x;
      this.ball.y = ballState.y;
    }
  }

  private handlePlayer1Input(delta: number): void {
    const player = this.player1;
    const moveSpeed = player.character.getMovementSpeed();
    const jumpForce = player.character.getJumpForce();

    // Movement
    let velocityX = 0;
    const movingLeft = (this.cursors?.left?.isDown ?? false) || (this.wasd?.A.isDown ?? false) || this.touchControls.left;
    const movingRight = (this.cursors?.right?.isDown ?? false) || (this.wasd?.D.isDown ?? false) || this.touchControls.right;

    if (movingLeft) {
      velocityX = -moveSpeed;
    } else if (movingRight) {
      velocityX = moveSpeed;
    }
    player.body.setVelocityX(velocityX);

    // Jump
    const wantsJump =
      (this.cursors?.up?.isDown ?? false) ||
      (this.wasd?.W.isDown ?? false) ||
      (this.spaceKey?.isDown ?? false) ||
      this.touchControls.jump;
    if (wantsJump && !player.isJumping && player.body.blocked.down) {
      player.body.setVelocityY(-jumpForce);
      player.isJumping = true;
    }

    // Check if landed
    if (player.body.blocked.down) {
      player.isJumping = false;
    }

    // Play animations (only for sprites)
    this.updatePlayerAnimation(player, velocityX !== 0, movingLeft);
  }

  private updatePlayerAnimation(player: PlayerObject, isMoving: boolean, facingLeft: boolean): void {
    const sprite = player.sprite;
    if (!(sprite instanceof Phaser.GameObjects.Sprite)) return;

    const charId = player.character.id;
    const animKey = player.isJumping
      ? (player.body.velocity.y < 0 ? `${charId}-jump` : `${charId}-fall`)
      : isMoving
        ? `${charId}-run`
        : `${charId}-idle`;

    // Only change animation if different
    if (sprite.anims.currentAnim?.key !== animKey) {
      sprite.play(animKey, true);
    }

    // Flip sprite based on direction (player 1 faces right by default)
    if (player.side === 'left') {
      sprite.setFlipX(facingLeft);
    } else {
      // Player 2 faces left by default, so flip logic is inverted
      sprite.setFlipX(!facingLeft);
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

    // Play CPU animations
    const isMoving = Math.abs(cpu.body.velocity.x) > 10;
    const movingLeft = cpu.body.velocity.x < 0;
    this.updatePlayerAnimation(cpu, isMoving, movingLeft);
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
