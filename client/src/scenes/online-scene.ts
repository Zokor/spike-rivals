import Phaser from 'phaser';

export class OnlineScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OnlineScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.text(width / 2, height / 2 - 20, 'ONLINE LOBBY', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, 'Coming Soon...', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Back button
    const backButton = this.add.text(width / 2, height - 40, 'BACK', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 20, y: 8 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => backButton.setStyle({ backgroundColor: '#4444aa' }));
    backButton.on('pointerout', () => backButton.setStyle({ backgroundColor: '#333366' }));
    backButton.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }
}
