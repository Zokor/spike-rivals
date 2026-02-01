import Phaser from 'phaser';

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

    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff88, 1);
      progressBar.fillRect(width / 4 + 5, height / 2 - 10, (width / 2 - 10) * value, 20);
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
    // this.load.image('logo', 'assets/sprites/ui/logo.png');
    // this.load.image('logo-small', 'assets/sprites/ui/logo-small.png');
    // this.load.image('title-screen', 'assets/sprites/ui/title-screen.png');
    // this.load.spritesheet('press-start', 'assets/sprites/ui/press-start.png', { frameWidth: 96, frameHeight: 16 });

    // --- Characters (24x32 spritesheets) ---
    this.load.spritesheet('char-blitz', 'assets/sprites/characters/blitz.png', { frameWidth: 24, frameHeight: 32 });
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
    // this.load.image('ball', 'assets/sprites/ball.png');

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

    this.scene.start('MenuScene');
  }

  private createCharacterAnimations(): void {
    // Animation frame layout (10 cols x 4 rows = 40 frames per character):
    // Row 0 (0-9): Idle animation
    // Row 1 (10-19): Run animation
    // Row 2 (20-29): Jump animation
    // Row 3 (30-39): Hit/Special animation

    const characters = ['blitz', 'crusher', 'sky', 'zen', 'tank', 'flash', 'nova', 'ghost'];

    for (const charId of characters) {
      const key = `char-${charId}`;

      // Skip if texture not loaded
      if (!this.textures.exists(key)) continue;

      // Idle animation (first row, frames 0-3)
      this.anims.create({
        key: `${charId}-idle`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });

      // Run animation (second row, frames 10-17)
      this.anims.create({
        key: `${charId}-run`,
        frames: this.anims.generateFrameNumbers(key, { start: 10, end: 17 }),
        frameRate: 10,
        repeat: -1,
      });

      // Jump animation (third row, frames 20-23)
      this.anims.create({
        key: `${charId}-jump`,
        frames: this.anims.generateFrameNumbers(key, { start: 20, end: 23 }),
        frameRate: 8,
        repeat: 0,
      });

      // Fall animation (third row, frames 24-27)
      this.anims.create({
        key: `${charId}-fall`,
        frames: this.anims.generateFrameNumbers(key, { start: 24, end: 27 }),
        frameRate: 8,
        repeat: 0,
      });
    }
  }
}
