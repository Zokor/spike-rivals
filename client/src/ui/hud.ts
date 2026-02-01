import Phaser from 'phaser';
import { UI_SAFE } from '@spike-rivals/shared';
import { GAME_WIDTH } from '../config';

export class HUD extends Phaser.GameObjects.Container {
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private p1Score = 0;
  private p2Score = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.create();
    scene.add.existing(this);
  }

  private create(): void {
    // Score display (with safe margin for ENVELOP scaling)
    const scoreY = UI_SAFE.TOP + 8;
    this.scoreText = this.scene.add.text(GAME_WIDTH / 2, scoreY, '0 - 0', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(this.scoreText);

    // Timer (optional, for timed modes)
    this.timerText = this.scene.add.text(GAME_WIDTH / 2, scoreY + 20, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);
    this.add(this.timerText);
  }

  updateScore(p1: number, p2: number): void {
    this.p1Score = p1;
    this.p2Score = p2;
    this.scoreText.setText(`${p1} - ${p2}`);
  }

  updateTimer(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
  }

  hideTimer(): void {
    this.timerText.setVisible(false);
  }

  showTimer(): void {
    this.timerText.setVisible(true);
  }

  animateScore(side: 'left' | 'right'): void {
    this.scene.tweens.add({
      targets: this.scoreText,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      ease: 'Bounce.easeOut',
    });
  }
}
