import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class GameOverDialog extends Phaser.GameObjects.Container {
  private onRematch?: () => void;
  private onQuit?: () => void;

  constructor(scene: Phaser.Scene, onRematch?: () => void, onQuit?: () => void) {
    super(scene, 0, 0);
    this.onRematch = onRematch;
    this.onQuit = onQuit;
    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(1000);
  }

  show(winner: 'left' | 'right', p1Score: number, p2Score: number): void {
    this.removeAll(true);

    // Dark overlay
    const overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8
    );
    this.add(overlay);

    // Winner text
    const winnerText = winner === 'left' ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
    const title = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, winnerText, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: winner === 'left' ? '#00ff88' : '#ff6688',
    }).setOrigin(0.5);
    this.add(title);

    // Final score
    const score = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `${p1Score} - ${p2Score}`, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(score);

    // Rematch button
    const rematchBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'REMATCH', () => {
      this.hide();
      this.onRematch?.();
    });
    this.add(rematchBtn);

    // Quit button
    const quitBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55, 'QUIT', () => {
      this.onQuit?.();
    });
    this.add(quitBtn);

    this.setVisible(true);

    // Animate entrance
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
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

  hide(): void {
    this.setVisible(false);
  }
}
