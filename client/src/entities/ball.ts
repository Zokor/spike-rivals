import Phaser from 'phaser';
import { PHYSICS } from '@spike-rivals/shared';
import type { Player } from './player';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface HitResult {
  velocityX: number;
  velocityY: number;
  spin: number;
}

export class Ball extends Phaser.GameObjects.Container {
  private sprite!: Phaser.GameObjects.Arc;
  private trailGraphics!: Phaser.GameObjects.Graphics;

  // Physics properties
  private velocityX = 0;
  private velocityY = 0;
  private spin = 0; // Positive = curves right, negative = curves left
  private readonly gravity = PHYSICS.GRAVITY;
  private readonly bounce = PHYSICS.BALL_BOUNCE;
  private readonly maxSpeed = PHYSICS.MAX_BALL_SPEED;
  private readonly spinDecay = 0.98; // Spin decreases over time
  private readonly spinEffect = 50; // How much spin affects horizontal velocity

  // Trail effect
  private trail: TrailPoint[] = [];
  private readonly maxTrailLength = 5;
  private trailUpdateTimer = 0;
  private readonly trailUpdateInterval = 16; // ~60fps

  // State
  private lastHitBy: 'left' | 'right' | null = null;
  private hitCooldown = 0;
  private readonly hitCooldownDuration = 100; // ms

  // Rotation for visual effect
  private rotation = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createTrailGraphics();
    this.createSprite();
    scene.add.existing(this);
  }

  private createTrailGraphics(): void {
    this.trailGraphics = this.scene.add.graphics();
    this.trailGraphics.setDepth(-1);
  }

  private createSprite(): void {
    this.sprite = this.scene.add.circle(0, 0, PHYSICS.BALL_RADIUS, 0xffff00);
    this.add(this.sprite);
  }

  /**
   * Main update loop - apply physics
   */
  update(delta: number): void {
    const dt = delta / 1000;

    // Update cooldown
    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }

    // Apply gravity
    this.velocityY += this.gravity * dt;

    // Apply spin effect to horizontal velocity
    if (Math.abs(this.spin) > 0.1) {
      this.velocityX += this.spin * this.spinEffect * dt;
      this.spin *= this.spinDecay;
    }

    // Update position
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Clamp velocity
    this.velocityX = Phaser.Math.Clamp(this.velocityX, -this.maxSpeed, this.maxSpeed);
    this.velocityY = Phaser.Math.Clamp(this.velocityY, -this.maxSpeed, this.maxSpeed);

    // Check bounds and collisions
    this.checkBounds();

    // Update visual rotation based on velocity and spin
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    this.rotation += (speed * 0.01 + this.spin * 0.5) * dt;

    // Update trail
    this.updateTrail(delta);
    this.renderTrail();
  }

  /**
   * Handle wall and ceiling bounces
   */
  private checkBounds(): void {
    const radius = PHYSICS.BALL_RADIUS;

    // Left wall
    if (this.x <= radius) {
      this.x = radius;
      this.velocityX = Math.abs(this.velocityX) * this.bounce;
      this.spin *= -0.5; // Reverse and reduce spin on wall hit
    }

    // Right wall
    if (this.x >= PHYSICS.COURT_WIDTH - radius) {
      this.x = PHYSICS.COURT_WIDTH - radius;
      this.velocityX = -Math.abs(this.velocityX) * this.bounce;
      this.spin *= -0.5;
    }

    // Ceiling
    if (this.y <= radius) {
      this.y = radius;
      this.velocityY = Math.abs(this.velocityY) * this.bounce;
    }

    // Net collision
    this.checkNetCollision();
  }

  /**
   * Check and handle collision with the net
   */
  private checkNetCollision(): void {
    const radius = PHYSICS.BALL_RADIUS;
    const netLeft = PHYSICS.COURT_WIDTH / 2 - PHYSICS.NET_COLLISION_WIDTH / 2;
    const netRight = PHYSICS.COURT_WIDTH / 2 + PHYSICS.NET_COLLISION_WIDTH / 2;
    const netTop = PHYSICS.GROUND_Y - PHYSICS.NET_HEIGHT;

    // Only check if ball is at net height
    if (this.y < netTop - radius || this.y > PHYSICS.GROUND_Y) {
      return;
    }

    // Check horizontal collision with net
    if (this.x + radius > netLeft && this.x - radius < netRight) {
      // Determine which side to bounce to
      if (this.velocityX > 0) {
        // Moving right, bounce left
        this.x = netLeft - radius;
        this.velocityX = -Math.abs(this.velocityX) * this.bounce * 0.8;
      } else {
        // Moving left, bounce right
        this.x = netRight + radius;
        this.velocityX = Math.abs(this.velocityX) * this.bounce * 0.8;
      }

      // Check top of net collision
      if (this.y - radius < netTop && this.y > netTop - radius * 2) {
        this.y = netTop - radius;
        this.velocityY = -Math.abs(this.velocityY) * this.bounce * 0.5;
      }
    }
  }

  /**
   * Calculate hit result when player hits the ball
   */
  hitByPlayer(
    player: Player,
    playerVelocityX: number,
    playerVelocityY: number,
    controlFactor: number
  ): HitResult {
    if (this.hitCooldown > 0) {
      return { velocityX: this.velocityX, velocityY: this.velocityY, spin: this.spin };
    }

    const hitPower = player.hitPower;

    // Calculate direction from player to ball
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction
    const dirX = distance > 0 ? dx / distance : 0;
    const dirY = distance > 0 ? dy / distance : -1;

    // Add randomness based on control (less control = more random)
    const randomFactor = 1 - controlFactor; // 0 to 0.5
    const randomAngle = (Math.random() - 0.5) * randomFactor * Math.PI * 0.5;

    // Rotate direction by random angle
    const cos = Math.cos(randomAngle);
    const sin = Math.sin(randomAngle);
    const finalDirX = dirX * cos - dirY * sin;
    const finalDirY = dirX * sin + dirY * cos;

    // Calculate new velocity
    // Base velocity from hit power and direction
    let newVelX = finalDirX * hitPower;
    let newVelY = finalDirY * hitPower;

    // Add player momentum (30% transfer)
    newVelX += playerVelocityX * 0.3;
    newVelY += playerVelocityY * 0.3;

    // Ensure ball goes upward if hit from below
    if (dy < 0 && newVelY > -100) {
      newVelY = Math.min(newVelY, -200);
    }

    // Calculate spin based on horizontal player movement
    const newSpin = playerVelocityX * 0.01 * (1 + randomFactor);

    // Apply the hit
    this.velocityX = Phaser.Math.Clamp(newVelX, -this.maxSpeed, this.maxSpeed);
    this.velocityY = Phaser.Math.Clamp(newVelY, -this.maxSpeed, this.maxSpeed);
    this.spin = Phaser.Math.Clamp(newSpin, -3, 3);
    this.hitCooldown = this.hitCooldownDuration;

    // Visual feedback - squash effect
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.4,
      scaleY: 0.6,
      duration: 50,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    return {
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      spin: this.spin,
    };
  }

  /**
   * Update trail positions
   */
  private updateTrail(delta: number): void {
    this.trailUpdateTimer += delta;

    if (this.trailUpdateTimer >= this.trailUpdateInterval) {
      this.trailUpdateTimer = 0;

      // Add current position to trail
      this.trail.unshift({
        x: this.x,
        y: this.y,
        alpha: 1,
      });

      // Remove old trail points
      while (this.trail.length > this.maxTrailLength) {
        this.trail.pop();
      }

      // Decay alpha for existing points
      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].alpha = 1 - (i / this.maxTrailLength);
      }
    }
  }

  /**
   * Render the trail effect
   */
  private renderTrail(): void {
    this.trailGraphics.clear();

    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);

    // Only show trail when moving fast
    if (speed < 100 || this.trail.length < 2) {
      return;
    }

    // Draw trail circles with decreasing size and alpha
    for (let i = 1; i < this.trail.length; i++) {
      const point = this.trail[i];
      const alpha = point.alpha * 0.5 * (speed / this.maxSpeed);
      const radius = PHYSICS.BALL_RADIUS * (1 - i / this.maxTrailLength) * 0.8;

      // Color based on spin (cyan for left spin, pink for right spin, yellow for neutral)
      let color = 0xffff00;
      if (this.spin > 0.5) {
        color = Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 255, g: 255, b: 0 },
          { r: 255, g: 100, b: 200 },
          1,
          Math.min(1, this.spin / 2)
        );
        color = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      } else if (this.spin < -0.5) {
        color = Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 255, g: 255, b: 0 },
          { r: 100, g: 200, b: 255 },
          1,
          Math.min(1, Math.abs(this.spin) / 2)
        );
        color = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      }

      this.trailGraphics.fillStyle(color, alpha);
      this.trailGraphics.fillCircle(point.x, point.y, radius);
    }
  }

  /**
   * Set velocity directly
   */
  setVelocity(x: number, y: number): void {
    this.velocityX = Phaser.Math.Clamp(x, -this.maxSpeed, this.maxSpeed);
    this.velocityY = Phaser.Math.Clamp(y, -this.maxSpeed, this.maxSpeed);
  }

  /**
   * Get current velocity
   */
  getVelocity(): { x: number; y: number } {
    return { x: this.velocityX, y: this.velocityY };
  }

  /**
   * Set spin value
   */
  setSpin(value: number): void {
    this.spin = Phaser.Math.Clamp(value, -3, 3);
  }

  /**
   * Get current spin
   */
  getSpin(): number {
    return this.spin;
  }

  /**
   * Track who hit the ball last
   */
  setLastHitBy(side: 'left' | 'right'): void {
    this.lastHitBy = side;
  }

  getLastHitBy(): 'left' | 'right' | null {
    return this.lastHitBy;
  }

  /**
   * Check if ball can be hit (cooldown expired)
   */
  canBeHit(): boolean {
    return this.hitCooldown <= 0;
  }

  /**
   * Reset ball to serve position
   */
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.spin = 0;
    this.lastHitBy = null;
    this.hitCooldown = 0;
    this.trail = [];
    this.trailGraphics.clear();

    // Reset visual
    this.sprite.setScale(1, 1);
  }

  /**
   * Check if ball has touched the ground
   */
  isOnGround(): boolean {
    return this.y >= PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS;
  }

  /**
   * Get which side of the court the ball is on
   */
  getSide(): 'left' | 'right' {
    return this.x < PHYSICS.COURT_WIDTH / 2 ? 'left' : 'right';
  }

  /**
   * Get the ball's current speed
   */
  getSpeed(): number {
    return Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
  }

  /**
   * Predict where ball will land (for AI)
   */
  predictLanding(): { x: number; time: number } | null {
    // Simple projectile prediction
    let simX = this.x;
    let simY = this.y;
    let simVelX = this.velocityX;
    let simVelY = this.velocityY;
    let simSpin = this.spin;
    const dt = 1 / 60;
    let time = 0;
    const maxTime = 5; // Max 5 seconds prediction

    while (time < maxTime) {
      simVelY += this.gravity * dt;
      simVelX += simSpin * this.spinEffect * dt;
      simSpin *= this.spinDecay;

      simX += simVelX * dt;
      simY += simVelY * dt;
      time += dt;

      // Wall bounces
      if (simX <= PHYSICS.BALL_RADIUS) {
        simX = PHYSICS.BALL_RADIUS;
        simVelX = Math.abs(simVelX) * this.bounce;
      } else if (simX >= PHYSICS.COURT_WIDTH - PHYSICS.BALL_RADIUS) {
        simX = PHYSICS.COURT_WIDTH - PHYSICS.BALL_RADIUS;
        simVelX = -Math.abs(simVelX) * this.bounce;
      }

      // Ground check
      if (simY >= PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS) {
        return { x: simX, time };
      }
    }

    return null;
  }

  /**
   * Clean up graphics on destroy
   */
  destroy(fromScene?: boolean): void {
    this.trailGraphics.destroy();
    super.destroy(fromScene);
  }
}
