import Phaser from 'phaser';
import { PHYSICS, Character, type CharacterId } from '@spike-rivals/shared';
import type { Ball } from './ball';

/**
 * Unified input state from any input source (keyboard, gamepad, touch)
 */
export interface InputState {
  moveX: number; // -1 (left) to 1 (right)
  moveY: number; // -1 (up) to 1 (down) - for menus, not used in gameplay
  jump: boolean; // Jump button held
  jumpPressed: boolean; // Jump button just pressed this frame
  action: boolean; // Action button (not used yet)
}

type AnimationState = 'idle' | 'run' | 'jump' | 'fall' | 'hit' | 'victory' | 'defeat';

export class Player extends Phaser.GameObjects.Container {
  // Visual
  private sprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  private shadowSprite!: Phaser.GameObjects.Ellipse;

  // Character data
  private character: Character;
  private readonly side: 'left' | 'right';

  // Physics
  private velocityX = 0;
  private velocityY = 0;
  private isGrounded = true;

  // Hit mechanics
  private canHit = true;
  private hitCooldown = 0;
  private readonly hitCooldownDuration = 200; // ms
  private readonly hitRange = 28; // pixels - distance to auto-hit ball

  // Animation state
  private currentAnimation: AnimationState = 'idle';
  private facingRight: boolean;

  // Input state
  private lastInput: InputState = {
    moveX: 0,
    moveY: 0,
    jump: false,
    jumpPressed: false,
    action: false,
  };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterId: CharacterId,
    side: 'left' | 'right'
  ) {
    super(scene, x, y);
    this.character = Character.fromId(characterId);
    this.side = side;
    this.facingRight = side === 'left'; // Left player faces right, right player faces left

    this.createSprite();
    scene.add.existing(this);
  }

  private createSprite(): void {
    // Shadow
    this.shadowSprite = this.scene.add.ellipse(
      0,
      PHYSICS.PLAYER_HEIGHT / 2,
      PHYSICS.PLAYER_WIDTH,
      8,
      0x000000,
      0.3
    );
    this.add(this.shadowSprite);

    // Player sprite - use character sprite if available, otherwise placeholder
    const textureKey = `char-${this.character.id}`;
    if (this.scene.textures.exists(textureKey)) {
      // Use actual character sprite
      this.sprite = this.scene.add.sprite(0, 0, textureKey);
      // Set origin to center-bottom for proper positioning
      this.sprite.setOrigin(0.5, 1);
      this.sprite.setY(PHYSICS.PLAYER_HEIGHT / 2);
    } else {
      // Fallback to placeholder rectangle
      const color = this.side === 'left' ? 0x00ff88 : 0xff6688;
      this.sprite = this.scene.add.rectangle(
        0,
        0,
        PHYSICS.PLAYER_WIDTH,
        PHYSICS.PLAYER_HEIGHT,
        color
      );
    }
    this.add(this.sprite);
  }

  // ==================== Attribute Getters ====================

  get speed(): number {
    return this.character.getMovementSpeed();
  }

  get jumpForce(): number {
    return this.character.getJumpForce();
  }

  get hitPower(): number {
    return this.character.getHitPower();
  }

  get controlFactor(): number {
    return this.character.getControlFactor();
  }

  get characterId(): CharacterId {
    return this.character.id;
  }

  getSide(): 'left' | 'right' {
    return this.side;
  }

  getVelocity(): { x: number; y: number } {
    return { x: this.velocityX, y: this.velocityY };
  }

  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  getCanHit(): boolean {
    return this.canHit;
  }

  // ==================== Input Handling ====================

  /**
   * Process input state and update player movement
   */
  handleInput(input: InputState): void {
    this.lastInput = input;

    // Horizontal movement
    if (input.moveX < -0.1) {
      this.moveLeft();
    } else if (input.moveX > 0.1) {
      this.moveRight();
    } else {
      this.stop();
    }

    // Jump (only on press, not hold)
    if (input.jumpPressed) {
      this.jump();
    }
  }

  /**
   * Move player left
   */
  moveLeft(): void {
    this.velocityX = -this.speed;
    this.facingRight = false;
    if (this.isGrounded && this.currentAnimation !== 'run') {
      this.playAnimation('run');
    }
  }

  /**
   * Move player right
   */
  moveRight(): void {
    this.velocityX = this.speed;
    this.facingRight = true;
    if (this.isGrounded && this.currentAnimation !== 'run') {
      this.playAnimation('run');
    }
  }

  /**
   * Stop horizontal movement
   */
  stop(): void {
    this.velocityX = 0;
    if (this.isGrounded && this.currentAnimation === 'run') {
      this.playAnimation('idle');
    }
  }

  /**
   * Make the player jump if grounded
   */
  jump(): void {
    if (this.isGrounded) {
      this.velocityY = -this.jumpForce;
      this.isGrounded = false;
      this.playAnimation('jump');

      // Visual feedback - alpha pulse (pixel-safe)
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.85,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }

  // ==================== Ball Interaction ====================

  /**
   * Check if player can hit the ball and calculate hit
   */
  hitBall(ball: Ball): boolean {
    if (!this.canHit) {
      return false;
    }

    // Check distance to ball
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.hitRange + PHYSICS.BALL_RADIUS) {
      return false;
    }

    // Check if ball can be hit (has its own cooldown)
    if (!ball.canBeHit()) {
      return false;
    }

    // Perform the hit
    ball.hitByPlayer(this, this.velocityX, this.velocityY, this.controlFactor);
    ball.setLastHitBy(this.side);

    // Play hit animation
    this.playAnimation('hit');

    // Start cooldown
    this.canHit = false;
    this.hitCooldown = this.hitCooldownDuration;

    // Visual feedback - alpha pulse (pixel-safe)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      duration: 50,
      yoyo: true,
    });

    return true;
  }

  /**
   * Check if ball is within auto-hit range
   */
  isBallInRange(ball: Ball): boolean {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.hitRange + PHYSICS.BALL_RADIUS;
  }

  // ==================== Animation ====================

  /**
   * Play a specific animation
   */
  playAnimation(name: AnimationState): void {
    if (this.currentAnimation === name) return;

    this.currentAnimation = name;

    // Check if using actual sprite or placeholder rectangle
    const isRectangle = this.sprite instanceof Phaser.GameObjects.Rectangle;

    if (isRectangle) {
      // Placeholder: use color changes as visual feedback
      const rect = this.sprite as Phaser.GameObjects.Rectangle;
      switch (name) {
        case 'idle':
          rect.setFillStyle(this.side === 'left' ? 0x00ff88 : 0xff6688);
          break;
        case 'run':
          rect.setFillStyle(this.side === 'left' ? 0x00dd77 : 0xdd5577);
          break;
        case 'jump':
          rect.setFillStyle(this.side === 'left' ? 0x44ffaa : 0xff88aa);
          break;
        case 'fall':
          rect.setFillStyle(this.side === 'left' ? 0x00cc66 : 0xcc4466);
          break;
        case 'hit':
          rect.setFillStyle(0xffffff);
          this.scene.time.delayedCall(100, () => {
            if (this.currentAnimation === 'hit') {
              this.playAnimation(this.isGrounded ? 'idle' : 'fall');
            }
          });
          break;
        case 'victory':
          rect.setFillStyle(0xffff00);
          break;
        case 'defeat':
          rect.setFillStyle(0x666666);
          break;
      }
    } else {
      // Actual sprite: play animations when defined
      // TODO: Add animation playback when spritesheet animations are created
      // const sprite = this.sprite as Phaser.GameObjects.Sprite;
      // sprite.play(`${this.character.id}-${name}`);
    }

    // Flip sprite based on facing direction
    this.sprite.setScale(this.facingRight ? 1 : -1, 1);
  }

  /**
   * Get current animation state
   */
  getCurrentAnimation(): AnimationState {
    return this.currentAnimation;
  }

  // ==================== Update Loop ====================

  /**
   * Main update loop - handle physics and state
   */
  update(delta: number): void {
    const dt = delta / 1000;

    // Update hit cooldown
    if (!this.canHit) {
      this.hitCooldown -= delta;
      if (this.hitCooldown <= 0) {
        this.canHit = true;
        this.hitCooldown = 0;
      }
    }

    // Apply gravity when in air
    if (!this.isGrounded) {
      this.velocityY += PHYSICS.GRAVITY * dt;

      // Switch to fall animation when descending
      if (this.velocityY > 0 && this.currentAnimation === 'jump') {
        this.playAnimation('fall');
      }
    }

    // Update position
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Ground collision
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    if (this.y >= groundY) {
      this.y = groundY;

      const wasInAir = !this.isGrounded;
      this.velocityY = 0;
      this.isGrounded = true;

      // Land animation
      if (wasInAir) {
        this.playAnimation('idle');

        // Landing feedback - alpha pulse (pixel-safe)
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.85,
          duration: 80,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      }
    }

    // Court boundaries - cannot cross net or leave sides
    this.clampToBounds();

    // Update shadow position and scale based on height
    this.updateShadow();

    // Update animation state based on movement
    this.updateAnimationState();
  }

  /**
   * Clamp player position to valid court area
   */
  private clampToBounds(): void {
    const halfWidth = PHYSICS.PLAYER_WIDTH / 2;
    const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
    const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;

    if (this.side === 'left') {
      // Left player: can move from left edge to net
      this.x = Phaser.Math.Clamp(this.x, halfWidth, netLeft - halfWidth);
    } else {
      // Right player: can move from net to right edge
      this.x = Phaser.Math.Clamp(this.x, netRight + halfWidth, PHYSICS.COURT_WIDTH - halfWidth);
    }
  }

  /**
   * Update shadow based on player height
   */
  private updateShadow(): void {
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_HEIGHT / 2;
    const heightAboveGround = groundY - this.y;
    const maxHeight = this.jumpForce * 0.5; // Approximate max jump height

    // Fade shadow based on height (keep scale integer for pixel art)
    const alpha = Math.max(0.1, 0.3 - (heightAboveGround / maxHeight) * 0.2);
    this.shadowSprite.setAlpha(alpha);

    // Keep shadow at ground level relative to player
    this.shadowSprite.y = PHYSICS.PLAYER_HEIGHT / 2 + heightAboveGround;
  }

  /**
   * Update animation based on current state
   */
  private updateAnimationState(): void {
    if (this.currentAnimation === 'hit' ||
        this.currentAnimation === 'victory' ||
        this.currentAnimation === 'defeat') {
      return; // Don't interrupt these animations
    }

    if (!this.isGrounded) {
      if (this.velocityY < 0) {
        this.playAnimation('jump');
      } else {
        this.playAnimation('fall');
      }
    } else if (Math.abs(this.velocityX) > 10) {
      this.playAnimation('run');
    } else {
      this.playAnimation('idle');
    }
  }

  // ==================== Special States ====================

  /**
   * Play victory animation
   */
  victory(): void {
    this.playAnimation('victory');
    this.velocityX = 0;

    // Jump for joy
    if (this.isGrounded) {
      this.velocityY = -this.jumpForce * 0.5;
      this.isGrounded = false;
    }
  }

  /**
   * Play defeat animation
   */
  defeat(): void {
    this.playAnimation('defeat');
    this.velocityX = 0;
  }

  /**
   * Reset player to starting position
   */
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.canHit = true;
    this.hitCooldown = 0;
    this.sprite.setScale(1, 1);
    this.playAnimation('idle');
  }

  /**
   * Freeze player (for countdowns, etc.)
   */
  freeze(): void {
    this.velocityX = 0;
    this.velocityY = 0;
  }
}
