import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class PauseMenu extends Phaser.GameObjects.Container {
  private overlay!: Phaser.GameObjects.Rectangle;
  private onResume?: () => void;
  private onQuit?: () => void;

  constructor(scene: Phaser.Scene, onResume?: () => void, onQuit?: () => void) {
    super(scene, 0, 0);
    this.onResume = onResume;
    this.onQuit = onQuit;
    this.create();
    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(1000);
  }

  private create(): void {
    // Dark overlay
    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );
    this.add(this.overlay);

    // Title
    const title = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'PAUSED', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(title);

    // Resume button
    const resumeBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'RESUME', () => {
      this.hide();
      this.onResume?.();
    });
    this.add(resumeBtn);

    // Quit button
    const quitBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35, 'QUIT', () => {
      this.onQuit?.();
    });
    this.add(quitBtn);
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.scene.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 20, y: 8 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#4444aa' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#333366' }));
    btn.on('pointerdown', onClick);

    return btn;
  }

  show(): void {
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }
}
