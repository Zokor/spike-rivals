import Phaser from 'phaser';
import type { CharacterId } from '@spike-rivals/shared';

interface PortraitConfig {
  x: number;
  y: number;
  characterId: CharacterId;
  size: number;
  isLocked?: boolean;
}

// Placeholder colors for each character until we have sprites
const CHARACTER_COLORS: Record<CharacterId, number> = {
  blitz: 0x00ff88,
  crusher: 0xff4444,
  sky: 0x44aaff,
  zen: 0xffcc00,
  tank: 0x888888,
  flash: 0xffff00,
  nova: 0xff88ff,
  ghost: 0x8844ff,
};

export class CharacterPortrait extends Phaser.GameObjects.Container {
  readonly characterId: CharacterId;
  private background: Phaser.GameObjects.Rectangle;
  private portrait: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private border: Phaser.GameObjects.Rectangle;
  private lockIcon: Phaser.GameObjects.Text;
  private isSelected = false;
  private isLocked: boolean;
  private size: number;

  constructor(scene: Phaser.Scene, config: PortraitConfig) {
    super(scene, config.x, config.y);
    this.characterId = config.characterId;
    this.isLocked = config.isLocked ?? false;
    this.size = config.size;

    // Background
    this.background = scene.add.rectangle(0, 0, config.size, config.size, 0x222233);
    this.add(this.background);

    // Character portrait - use actual texture if available, otherwise placeholder
    const portraitKey = `portrait-${config.characterId}`;
    if (scene.textures.exists(portraitKey)) {
      this.portrait = scene.add.image(0, 0, portraitKey);
      // Scale portrait to fit the size
      const scale = (config.size - 4) / Math.max(this.portrait.width, this.portrait.height);
      this.portrait.setScale(scale);
      if (this.isLocked) {
        this.portrait.setTint(0x444444);
      }
    } else {
      // Fallback to placeholder rectangle with character color
      const color = this.isLocked ? 0x444444 : CHARACTER_COLORS[config.characterId];
      this.portrait = scene.add.rectangle(0, 0, config.size - 4, config.size - 4, color);
    }
    this.add(this.portrait);

    // Selection border (hidden by default)
    this.border = scene.add.rectangle(0, 0, config.size + 4, config.size + 4)
      .setStrokeStyle(2, 0xffffff)
      .setFillStyle(0x000000, 0);
    this.border.setVisible(false);
    this.add(this.border);

    // Lock icon
    this.lockIcon = scene.add.text(0, 0, '🔒', {
      fontSize: '16px',
    }).setOrigin(0.5);
    this.lockIcon.setVisible(this.isLocked);
    this.add(this.lockIcon);

    // Make interactive
    this.setSize(config.size, config.size);
    this.setInteractive({ useHandCursor: !this.isLocked });

    // Hover effects
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);

    scene.add.existing(this);
  }

  private onHover(): void {
    if (this.isLocked) return;

    this.border.setVisible(true);
    this.border.setStrokeStyle(2, 0xaaaaaa);

    this.scene.tweens.add({
      targets: this.border,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });
  }

  private onHoverEnd(): void {
    if (this.isLocked) return;

    if (!this.isSelected) {
      this.border.setVisible(false);
    }
    this.border.setAlpha(1);
  }

  select(): void {
    if (this.isLocked) return;

    this.isSelected = true;
    this.border.setVisible(true);
    this.border.setStrokeStyle(3, 0x00ff88);

    // Selection animation - border pulse (pixel-safe)
    this.scene.tweens.add({
      targets: this.border,
      alpha: 0.5,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 0,
    });
  }

  deselect(): void {
    this.isSelected = false;
    this.border.setVisible(false);
    this.border.setAlpha(1);
  }

  getIsSelected(): boolean {
    return this.isSelected;
  }

  getIsLocked(): boolean {
    return this.isLocked;
  }

  unlock(): void {
    this.isLocked = false;
    this.lockIcon.setVisible(false);
    if (this.portrait instanceof Phaser.GameObjects.Rectangle) {
      this.portrait.setFillStyle(CHARACTER_COLORS[this.characterId]);
    } else if (this.portrait instanceof Phaser.GameObjects.Image) {
      this.portrait.clearTint();
    }
    this.setInteractive({ useHandCursor: true });
  }
}
