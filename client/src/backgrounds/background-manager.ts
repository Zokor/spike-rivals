import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import {
  type BackgroundId,
  type BackgroundConfig,
  getBackgroundConfig,
  BACKGROUND_CONFIGS,
} from './background-config';

interface LayerObject {
  gameObject: Phaser.GameObjects.GameObject;
  scrollFactor: number;
}

export class BackgroundManager {
  private scene: Phaser.Scene;
  private currentBackground: BackgroundId | null = null;
  private layers: LayerObject[] = [];
  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private animatedElements: Phaser.GameObjects.GameObject[] = [];
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(-100);
  }

  /**
   * Load a background by ID
   */
  loadBackground(id: BackgroundId): void {
    // Clean up existing background
    this.cleanup();

    this.currentBackground = id;
    const config = getBackgroundConfig(id);

    // Create placeholder layers (will be replaced with actual sprites when available)
    this.createPlaceholderLayers(config);

    // Create particles
    if (config.particles) {
      this.createParticles(config);
    }
  }

  /**
   * Create placeholder background layers using graphics
   * These will be replaced with actual sprites when art assets are ready
   */
  private createPlaceholderLayers(config: BackgroundConfig): void {
    const { colors } = config;

    // Layer 0: Sky gradient
    const skyGradient = this.createGradientRect(
      GAME_WIDTH,
      GAME_HEIGHT * 0.6,
      colors.sky,
      this.lightenColor(colors.sky, 30)
    );
    skyGradient.setPosition(0, 0);
    this.container.add(skyGradient);
    this.layers.push({ gameObject: skyGradient, scrollFactor: 0 });

    // Layer 1: Far background elements
    const farBg = this.createFarBackground(config);
    this.container.add(farBg);
    this.layers.push({ gameObject: farBg, scrollFactor: 0.1 });

    // Layer 2: Mid background
    const midBg = this.createMidBackground(config);
    this.container.add(midBg);
    this.layers.push({ gameObject: midBg, scrollFactor: 0.3 });

    // Layer 3: Ground/Court
    const ground = this.createGround(config);
    this.container.add(ground);
    this.layers.push({ gameObject: ground, scrollFactor: 1 });

    // Add net placeholder
    this.createNet(config);
  }

  private createGradientRect(width: number, height: number, colorTop: number, colorBottom: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();

    // Simple two-tone gradient simulation
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(colorTop),
        Phaser.Display.Color.IntegerToColor(colorBottom),
        steps,
        i
      );
      const hex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      graphics.fillStyle(hex);
      graphics.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }

    return graphics;
  }

  private createFarBackground(config: BackgroundConfig): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // Create buildings/structures silhouettes based on theme
    switch (config.theme) {
      case 'Cyberpunk':
        this.addCyberpunkBuildings(container, config);
        break;
      case 'Classic':
        this.addBeachElements(container, config);
        break;
      case 'Sci-Fi':
        this.addSpaceElements(container, config);
        break;
      case 'Fantasy':
        this.addTempleElements(container, config);
        break;
      case 'Nostalgic':
        this.addArcadeElements(container, config);
        break;
      case 'Modern':
        this.addUrbanElements(container, config);
        break;
    }

    return container;
  }

  private addCyberpunkBuildings(container: Phaser.GameObjects.Container, config: BackgroundConfig): void {
    const graphics = this.scene.add.graphics();

    // Distant buildings
    for (let i = 0; i < 8; i++) {
      const x = i * 70 - 20;
      const height = 60 + Math.random() * 80;
      const width = 40 + Math.random() * 30;

      graphics.fillStyle(this.darkenColor(config.colors.sky, 20));
      graphics.fillRect(x, 160 - height, width, height);

      // Windows
      graphics.fillStyle(config.colors.accent, 0.3);
      for (let wy = 0; wy < height - 10; wy += 8) {
        for (let wx = 5; wx < width - 5; wx += 8) {
          if (Math.random() > 0.4) {
            graphics.fillRect(x + wx, 160 - height + wy + 5, 3, 4);
          }
        }
      }
    }

    // Neon sign placeholders
    const neonColors = [0xff006e, 0x00f5d4, 0xffcc00];
    for (let i = 0; i < 3; i++) {
      const sign = this.scene.add.rectangle(
        80 + i * 150,
        80 + Math.random() * 30,
        30 + Math.random() * 20,
        8,
        neonColors[i],
        0.8
      );
      container.add(sign);

      // Add glow effect via tween
      this.scene.tweens.add({
        targets: sign,
        alpha: 0.4,
        duration: 500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.animatedElements.push(sign);
    }

    container.add(graphics);
  }

  private addBeachElements(container: Phaser.GameObjects.Container, config: BackgroundConfig): void {
    const graphics = this.scene.add.graphics();

    // Ocean
    graphics.fillStyle(config.colors.ambient);
    graphics.fillRect(0, 80, GAME_WIDTH, 60);

    // Sun
    const sun = this.scene.add.circle(380, 50, 25, 0xffffff, 0.9);
    container.add(sun);

    // Sun glow
    this.scene.tweens.add({
      targets: sun,
      scale: 1.1,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.animatedElements.push(sun);

    container.add(graphics);
  }

  private addSpaceElements(container: Phaser.GameObjects.Container, config: BackgroundConfig): void {
    // Stars
    const graphics = this.scene.add.graphics();
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * 150;
      const size = Math.random() > 0.8 ? 2 : 1;
      graphics.fillStyle(0xffffff, 0.3 + Math.random() * 0.7);
      graphics.fillRect(x, y, size, size);
    }

    // Earth (partial)
    const earth = this.scene.add.circle(400, 200, 80, 0x457b9d, 0.8);
    container.add(earth);

    // Earth glow
    const earthGlow = this.scene.add.circle(400, 200, 85, 0x00f5d4, 0.2);
    container.add(earthGlow);

    container.add(graphics);
  }

  private addTempleElements(container: Phaser.GameObjects.Container, config: BackgroundConfig): void {
    const graphics = this.scene.add.graphics();

    // Two moons
    const moon1 = this.scene.add.circle(350, 40, 15, 0xecf0f1, 0.8);
    const moon2 = this.scene.add.circle(420, 60, 8, 0xbdc3c7, 0.6);
    container.add(moon1);
    container.add(moon2);

    // Floating stones
    for (let i = 0; i < 4; i++) {
      const stone = this.scene.add.rectangle(
        50 + i * 120,
        100 + Math.random() * 40,
        15 + Math.random() * 10,
        10 + Math.random() * 8,
        0x7f8c8d
      );
      container.add(stone);

      // Float animation
      this.scene.tweens.add({
        targets: stone,
        y: stone.y - 10,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.animatedElements.push(stone);
    }

    // Ruins silhouette
    graphics.fillStyle(0x2c3e50, 0.5);
    graphics.fillRect(30, 120, 40, 50);
    graphics.fillRect(60, 130, 30, 40);
    graphics.fillRect(380, 115, 50, 55);
    graphics.fillRect(420, 125, 35, 45);

    container.add(graphics);
  }

  private addArcadeElements(container: Phaser.GameObjects.Container, config: BackgroundConfig): void {
    const graphics = this.scene.add.graphics();

    // Arcade cabinets
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 80;

      // Cabinet body
      graphics.fillStyle(0x1a1a2e);
      graphics.fillRect(x, 100, 50, 80);

      // Screen
      const screenColor = [0xff006e, 0x00f5d4, 0xffd700, 0x00ff00][i % 4];
      graphics.fillStyle(screenColor, 0.6);
      graphics.fillRect(x + 5, 110, 40, 30);

      // Screen glow animation
      const glow = this.scene.add.rectangle(x + 25, 125, 40, 30, screenColor, 0.3);
      container.add(glow);

      this.scene.tweens.add({
        targets: glow,
        alpha: 0.1,
        duration: 300 + Math.random() * 200,
        yoyo: true,
        repeat: -1,
      });
      this.animatedElements.push(glow);
    }

    container.add(graphics);
  }

  private addUrbanElements(container: Phaser.GameObjects.Container, config: BackgroundConfig): void {
    const graphics = this.scene.add.graphics();

    // City skyline
    const buildingData = [
      { x: 0, w: 60, h: 100 },
      { x: 50, w: 40, h: 130 },
      { x: 100, w: 80, h: 90 },
      { x: 170, w: 50, h: 150 },
      { x: 230, w: 70, h: 110 },
      { x: 300, w: 45, h: 140 },
      { x: 350, w: 90, h: 95 },
      { x: 430, w: 55, h: 120 },
    ];

    buildingData.forEach((b) => {
      graphics.fillStyle(0x0f3460);
      graphics.fillRect(b.x, 170 - b.h, b.w, b.h);

      // Windows
      graphics.fillStyle(0xffd700, 0.3);
      for (let wy = 5; wy < b.h - 5; wy += 10) {
        for (let wx = 5; wx < b.w - 5; wx += 10) {
          if (Math.random() > 0.5) {
            graphics.fillRect(b.x + wx, 170 - b.h + wy, 4, 6);
          }
        }
      }
    });

    // Water tower
    graphics.fillStyle(0x16213e);
    graphics.fillRect(380, 50, 30, 40);
    graphics.fillRect(375, 40, 40, 15);

    container.add(graphics);
  }

  private createMidBackground(config: BackgroundConfig): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    // Mid-layer elements would go here
    // For now, just a subtle color overlay
    return container;
  }

  private createGround(config: BackgroundConfig): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const graphics = this.scene.add.graphics();

    // Ground color
    graphics.fillStyle(config.colors.ground);
    graphics.fillRect(0, 200, GAME_WIDTH, 70);

    // Court lines
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.strokeRect(20, 205, GAME_WIDTH - 40, 50);

    // Center line (net position)
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.lineBetween(GAME_WIDTH / 2, 205, GAME_WIDTH / 2, 255);

    container.add(graphics);
    return container;
  }

  private createNet(config: BackgroundConfig): void {
    const netX = GAME_WIDTH / 2;
    const netTop = 150;
    const netBottom = 230;

    const graphics = this.scene.add.graphics();

    // Net pole
    graphics.fillStyle(0xffffff);
    graphics.fillRect(netX - 2, netTop, 4, netBottom - netTop);

    // Net mesh (simple lines)
    graphics.lineStyle(1, 0xffffff, 0.6);
    for (let y = netTop; y < netBottom; y += 8) {
      graphics.lineBetween(netX - 3, y, netX + 3, y);
    }

    this.container.add(graphics);
  }

  private createParticles(config: BackgroundConfig): void {
    if (!config.particles) return;

    config.particles.forEach((particleConfig) => {
      // Create a simple particle texture
      const particleKey = `particle-${particleConfig.type}`;

      if (!this.scene.textures.exists(particleKey)) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffffff);

        switch (particleConfig.type) {
          case 'rain':
            graphics.fillRect(0, 0, 1, 4);
            break;
          case 'dust':
          case 'sparkles':
          case 'fireflies':
            graphics.fillCircle(2, 2, 2);
            break;
          case 'steam':
            graphics.fillCircle(4, 4, 4);
            break;
          default:
            graphics.fillCircle(2, 2, 2);
        }

        graphics.generateTexture(particleKey, 8, 8);
        graphics.destroy();
      }

      const emitter = this.scene.add.particles(0, 0, particleKey, particleConfig.config);
      emitter.setDepth(-50);
      this.particleEmitters.push(emitter);
    });
  }

  /**
   * Update parallax based on camera or player position
   */
  update(cameraX: number = 0): void {
    this.layers.forEach((layer) => {
      if (layer.gameObject && 'x' in layer.gameObject) {
        (layer.gameObject as Phaser.GameObjects.Container).x = -cameraX * layer.scrollFactor;
      }
    });
  }

  /**
   * Clean up all background elements
   */
  cleanup(): void {
    this.layers.forEach((layer) => {
      if (layer.gameObject) {
        layer.gameObject.destroy();
      }
    });
    this.layers = [];

    this.particleEmitters.forEach((emitter) => emitter.destroy());
    this.particleEmitters = [];

    this.animatedElements.forEach((el) => {
      this.scene.tweens.killTweensOf(el);
      el.destroy();
    });
    this.animatedElements = [];

    this.container.removeAll(true);
  }

  /**
   * Get current background ID
   */
  getCurrentBackground(): BackgroundId | null {
    return this.currentBackground;
  }

  private lightenColor(color: number, amount: number): number {
    const c = Phaser.Display.Color.IntegerToColor(color);
    return Phaser.Display.Color.GetColor(
      Math.min(255, c.red + amount),
      Math.min(255, c.green + amount),
      Math.min(255, c.blue + amount)
    );
  }

  private darkenColor(color: number, amount: number): number {
    const c = Phaser.Display.Color.IntegerToColor(color);
    return Phaser.Display.Color.GetColor(
      Math.max(0, c.red - amount),
      Math.max(0, c.green - amount),
      Math.max(0, c.blue - amount)
    );
  }

  destroy(): void {
    this.cleanup();
    this.container.destroy();
  }
}
