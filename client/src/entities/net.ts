import Phaser from 'phaser';
import { PHYSICS } from '@spike-rivals/shared';

export class Net extends Phaser.GameObjects.Container {
  private sprite!: Phaser.GameObjects.Rectangle; // TODO: Replace with Sprite

  constructor(scene: Phaser.Scene) {
    const x = PHYSICS.COURT_WIDTH / 2;
    const y = PHYSICS.GROUND_Y - PHYSICS.NET_HEIGHT / 2;

    super(scene, x, y);

    this.createSprite();
    scene.add.existing(this);
  }

  private createSprite(): void {
    this.sprite = this.scene.add.rectangle(0, 0, PHYSICS.NET_WIDTH, PHYSICS.NET_HEIGHT, 0xffffff);
    this.add(this.sprite);
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.x - PHYSICS.NET_WIDTH / 2,
      right: this.x + PHYSICS.NET_WIDTH / 2,
      top: this.y - PHYSICS.NET_HEIGHT / 2,
      bottom: this.y + PHYSICS.NET_HEIGHT / 2,
    };
  }
}
