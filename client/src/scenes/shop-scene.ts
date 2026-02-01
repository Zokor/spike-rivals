import Phaser from 'phaser';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.text(width / 2, 30, 'SHOP', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);

    // Currency display
    this.add.text(width - 10, 10, 'Coins: 1000 | Gems: 50', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(1, 0);

    // Placeholder shop categories
    const categories = ['SKINS', 'BALLS', 'COURTS', 'EFFECTS'];
    categories.forEach((cat, i) => {
      const btn = this.add.text(60 + i * 100, 70, cat, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: i === 0 ? '#4444aa' : '#333366',
        padding: { x: 10, y: 5 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        // TODO: Switch category
      });
    });

    // Placeholder items grid
    this.add.text(width / 2, height / 2, 'Shop items coming soon...', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5);

    // Back button
    const backButton = this.add.text(width / 2, height - 30, 'BACK', {
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

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }
}
