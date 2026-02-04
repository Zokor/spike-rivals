import Phaser from 'phaser';
import { BALL_SKINS } from '../data/shop-catalog';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 15, width / 2, 30);

    const loadingText = this.add
      .text(width / 2, height / 2 - 30, 'Loading...', {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff88, 1);
      progressBar.fillRect(
        width / 4 + 5,
        height / 2 - 10,
        (width / 2 - 10) * value,
        20,
      );
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // ============================================
    // LOAD YOUR ASSETS HERE
    // Uncomment lines as you add the PNG files
    // ============================================

    // --- Logo & Title Screen ---
    this.load.image('logo', 'assets/sprites/ui/logo.png');
    // this.load.image('logo-small', 'assets/sprites/ui/logo-small.png');
    // this.load.image('title-screen', 'assets/sprites/ui/title-screen.png');
    // this.load.spritesheet('press-start', 'assets/sprites/ui/press-start.png', { frameWidth: 96, frameHeight: 16 });

    // --- Characters (24x32 spritesheets) ---
    this.load.spritesheet('char-blitz', 'assets/sprites/characters/blitz.png', {
      frameWidth: 24,
      frameHeight: 32,
    });
    // this.load.spritesheet('char-crusher', 'assets/sprites/characters/crusher.png', { frameWidth: 24, frameHeight: 32 });
    // this.load.spritesheet('char-sky', 'assets/sprites/characters/sky.png', { frameWidth: 24, frameHeight: 32 });
    // this.load.spritesheet('char-zen', 'assets/sprites/characters/zen.png', { frameWidth: 24, frameHeight: 32 });
    // this.load.spritesheet('char-tank', 'assets/sprites/characters/tank.png', { frameWidth: 24, frameHeight: 32 });
    // this.load.spritesheet('char-flash', 'assets/sprites/characters/flash.png', { frameWidth: 24, frameHeight: 32 });
    // this.load.spritesheet('char-nova', 'assets/sprites/characters/nova.png', { frameWidth: 24, frameHeight: 32 });
    // this.load.spritesheet('char-ghost', 'assets/sprites/characters/ghost.png', { frameWidth: 24, frameHeight: 32 });

    // --- Character Portraits (80x80 for selection screen) ---
    this.load.image('portrait-blitz', 'assets/sprites/portraits/blitz.png');
    // this.load.image('portrait-crusher', 'assets/sprites/portraits/crusher.png');
    // ... etc

    // --- Ball ---
    const ballFrame = { frameWidth: 16, frameHeight: 16 };
    const ballAssetFilename = (key: string) => `${key}-spin`;
    this.load.spritesheet(
      'ball-default',
      `assets/sprites/balls/${ballAssetFilename('ball-default')}.png`,
      ballFrame
    );
    for (const ballSkin of BALL_SKINS) {
      this.load.spritesheet(
        ballSkin.spriteKey,
        `assets/sprites/balls/${ballAssetFilename(ballSkin.spriteKey)}.png`,
        ballFrame
      );
    }

    // --- Net ---
    // this.load.image('net', 'assets/sprites/net.png');

    // --- Backgrounds (480x270 each layer) ---
    // Neon District
    // this.load.image('neon-sky', 'assets/sprites/backgrounds/neon-district/sky.png');
    // this.load.image('neon-buildings-far', 'assets/sprites/backgrounds/neon-district/buildings-far.png');
    // this.load.image('neon-buildings-mid', 'assets/sprites/backgrounds/neon-district/buildings-mid.png');
    // this.load.image('neon-rooftop', 'assets/sprites/backgrounds/neon-district/rooftop.png');
    // this.load.image('neon-ground', 'assets/sprites/backgrounds/neon-district/ground.png');

    // Sunset Beach
    // this.load.image('beach-sky', 'assets/sprites/backgrounds/sunset-beach/sky.png');
    // this.load.image('beach-ocean', 'assets/sprites/backgrounds/sunset-beach/ocean.png');
    // this.load.image('beach-palms', 'assets/sprites/backgrounds/sunset-beach/palms.png');
    // this.load.image('beach-sand', 'assets/sprites/backgrounds/sunset-beach/sand.png');

    // Cyber Arena
    // this.load.image('cyber-back', 'assets/sprites/backgrounds/cyber-arena/back.png');
    // this.load.image('cyber-crowd', 'assets/sprites/backgrounds/cyber-arena/crowd.png');
    // this.load.image('cyber-structure', 'assets/sprites/backgrounds/cyber-arena/structure.png');
    // this.load.image('cyber-ground', 'assets/sprites/backgrounds/cyber-arena/ground.png');

    // Night Market
    // this.load.image('market-sky', 'assets/sprites/backgrounds/night-market/sky.png');
    // this.load.image('market-buildings', 'assets/sprites/backgrounds/night-market/buildings.png');
    // this.load.image('market-stalls', 'assets/sprites/backgrounds/night-market/stalls.png');
    // this.load.image('market-ground', 'assets/sprites/backgrounds/night-market/ground.png');

    // Retro Arcade
    // this.load.image('arcade-back', 'assets/sprites/backgrounds/retro-arcade/back.png');
    // this.load.image('arcade-cabinets', 'assets/sprites/backgrounds/retro-arcade/cabinets.png');
    // this.load.image('arcade-near', 'assets/sprites/backgrounds/retro-arcade/near.png');
    // this.load.image('arcade-ground', 'assets/sprites/backgrounds/retro-arcade/ground.png');

    // Space Station
    // this.load.image('space-stars', 'assets/sprites/backgrounds/space-station/stars.png');
    // this.load.image('space-earth', 'assets/sprites/backgrounds/space-station/earth.png');
    // this.load.image('space-station', 'assets/sprites/backgrounds/space-station/station.png');
    // this.load.image('space-ground', 'assets/sprites/backgrounds/space-station/ground.png');

    // Ancient Temple
    // this.load.image('temple-sky', 'assets/sprites/backgrounds/ancient-temple/sky.png');
    // this.load.image('temple-ruins', 'assets/sprites/backgrounds/ancient-temple/ruins.png');
    // this.load.image('temple-columns', 'assets/sprites/backgrounds/ancient-temple/columns.png');
    // this.load.image('temple-ground', 'assets/sprites/backgrounds/ancient-temple/ground.png');

    // Urban Rooftop
    // this.load.image('urban-sky', 'assets/sprites/backgrounds/urban-rooftop/sky.png');
    // this.load.image('urban-skyline', 'assets/sprites/backgrounds/urban-rooftop/skyline.png');
    // this.load.image('urban-rooftop', 'assets/sprites/backgrounds/urban-rooftop/rooftop.png');
    // this.load.image('urban-ground', 'assets/sprites/backgrounds/urban-rooftop/ground.png');

    // --- Audio ---
    // this.load.audio('hit', 'assets/audio/hit.wav');
    // this.load.audio('score', 'assets/audio/score.wav');
    // this.load.audio('jump', 'assets/audio/jump.wav');
    // this.load.audio('music-menu', 'assets/audio/music-menu.mp3');
    // this.load.audio('music-game', 'assets/audio/music-game.mp3');
  }

  create(): void {
    // Create character animations for loaded spritesheets
    this.createCharacterAnimations();
    this.createBallAnimations();

    this.scene.start('MenuScene');
  }

  private createCharacterAnimations(): void {
    // Canonical frame layout (240x128 = 10 cols x 4 rows of 24x32 frames):
    // Row 0: Idle (0-3), Run (4-9)
    // Row 1: Jump (10-12), Fall (13-15), Bump (16-19)
    // Row 2: Spike (20-23), Dive (24-26), Recover (27-29)
    // Row 3: Serve (30-33), Victory (34-37), Defeat (38-39)

    const characters = [
      'blitz',
      'crusher',
      'sky',
      'zen',
      'tank',
      'flash',
      'nova',
      'ghost',
    ];

    for (const charId of characters) {
      const key = `char-${charId}`;

      // Skip if texture not loaded
      if (!this.textures.exists(key)) continue;

      // Row 0: Idle (0-3) and Run (4-9)
      this.anims.create({
        key: `${charId}-idle`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });

      this.anims.create({
        key: `${charId}-run`,
        frames: this.anims.generateFrameNumbers(key, { start: 4, end: 9 }),
        frameRate: 12,
        repeat: -1,
      });

      // Row 1: Jump (10-12), Fall (13-15), Bump (16-19)
      this.anims.create({
        key: `${charId}-jump`,
        frames: this.anims.generateFrameNumbers(key, { start: 10, end: 12 }),
        frameRate: 10,
        repeat: 0,
      });

      this.anims.create({
        key: `${charId}-fall`,
        frames: this.anims.generateFrameNumbers(key, { start: 13, end: 15 }),
        frameRate: 10,
        repeat: 0,
      });

      this.anims.create({
        key: `${charId}-bump`,
        frames: this.anims.generateFrameNumbers(key, { start: 16, end: 19 }),
        frameRate: 12,
        repeat: 0,
      });

      // Row 2: Spike (20-23), Dive (24-26), Recover (27-29)
      this.anims.create({
        key: `${charId}-spike`,
        frames: this.anims.generateFrameNumbers(key, { start: 20, end: 23 }),
        frameRate: 12,
        repeat: 0,
      });

      this.anims.create({
        key: `${charId}-dive`,
        frames: this.anims.generateFrameNumbers(key, { start: 24, end: 26 }),
        frameRate: 12,
        repeat: 0,
      });

      this.anims.create({
        key: `${charId}-recover`,
        frames: this.anims.generateFrameNumbers(key, { start: 27, end: 29 }),
        frameRate: 10,
        repeat: 0,
      });

      // Row 3: Serve (30-33), Victory (34-37), Defeat (38-39)
      this.anims.create({
        key: `${charId}-serve`,
        frames: this.anims.generateFrameNumbers(key, { start: 30, end: 33 }),
        frameRate: 10,
        repeat: 0,
      });

      this.anims.create({
        key: `${charId}-victory`,
        frames: this.anims.generateFrameNumbers(key, { start: 34, end: 37 }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: `${charId}-defeat`,
        frames: this.anims.generateFrameNumbers(key, { start: 38, end: 39 }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  private createBallAnimations(): void {
    const ballKeys = ['ball-default', ...BALL_SKINS.map((skin) => skin.spriteKey)];

    for (const key of ballKeys) {
      if (!this.textures.exists(key)) continue;
      if (this.anims.exists(`${key}-spin`)) continue;

      const texture = this.textures.get(key);
      if (texture.frameTotal < 8) continue;

      this.anims.create({
        key: `${key}-spin`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }
  }
}
