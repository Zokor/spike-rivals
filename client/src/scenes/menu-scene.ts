import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MenuScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuButtons: Phaser.GameObjects.Text[] = [];
  private notice: string | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data: { notice?: string } | undefined): void {
    this.notice = data?.notice ?? null;
  }

  create(): void {
    // Use FIT mode for menu to prevent UI cropping on tall screens
    this.scale.setGameSize(GAME_WIDTH, GAME_HEIGHT);
    this.scale.scaleMode = Phaser.Scale.FIT;
    this.scale.refresh();

    const width = GAME_WIDTH;
    const height = GAME_HEIGHT;

    // Title
    this.add.text(width / 2, 50, 'SPIKE RIVALS', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 75, 'Competitive Volleyball', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5);

    // Menu options - go to character select first
    const menuItems = [
      { text: 'VS CPU', scene: 'CharacterSelectScene', mode: 'cpu' },
      { text: 'QUICK MATCH', scene: 'CharacterSelectScene', mode: 'quick' },
      { text: 'RANKED', scene: 'CharacterSelectScene', mode: 'ranked' },
      { text: 'PRIVATE ROOM', scene: 'CharacterSelectScene', mode: 'private' },
      { text: 'SHOP', scene: 'ShopScene', mode: null },
    ];

    this.menuButtons = [];

    menuItems.forEach((item, index) => {
      const button = this.add.text(width / 2, 110 + index * 30, item.text, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#333366',
        padding: { x: 25, y: 6 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        this.selectMenuItem(index);
      });

      button.on('pointerout', () => {
        if (this.selectedIndex !== index) {
          button.setStyle({ backgroundColor: '#333366' });
        }
      });

      button.on('pointerdown', () => {
        this.activateMenuItem(index);
      });

      this.menuButtons.push(button);
    });

    // Store menu items for keyboard navigation
    this.data.set('menuItems', menuItems);

    // Setup keyboard navigation
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown-UP', () => this.navigateMenu(-1));
      keyboard.on('keydown-DOWN', () => this.navigateMenu(1));
      keyboard.on('keydown-ENTER', () => this.activateMenuItem(this.selectedIndex));
      keyboard.on('keydown-SPACE', () => this.activateMenuItem(this.selectedIndex));
    }

    // Select first item
    this.selectMenuItem(0);

    // Version
    this.add.text(width - 5, height - 5, 'v0.1.0', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(1, 1);

    // Controls hint
    this.add.text(5, height - 5, 'Arrow Keys / Enter', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#444444',
    }).setOrigin(0, 1);

    if (this.notice) {
      const noticeText = this.add.text(width / 2, height - 18, this.notice, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#ffcc00',
      }).setOrigin(0.5, 1);
      this.time.delayedCall(3000, () => noticeText.setVisible(false));
      this.notice = null;
    }
  }

  private navigateMenu(direction: number): void {
    const newIndex = (this.selectedIndex + direction + this.menuButtons.length) % this.menuButtons.length;
    this.selectMenuItem(newIndex);
  }

  private selectMenuItem(index: number): void {
    // Deselect previous
    if (this.menuButtons[this.selectedIndex]) {
      this.menuButtons[this.selectedIndex].setStyle({ backgroundColor: '#333366' });
    }

    this.selectedIndex = index;

    // Select new
    this.menuButtons[index].setStyle({ backgroundColor: '#4444aa' });
  }

  private activateMenuItem(index: number): void {
    const menuItems = this.data.get('menuItems') as Array<{ text: string; scene: string; mode: string | null }>;
    const item = menuItems[index];

    // Button press animation
    this.tweens.add({
      targets: this.menuButtons[index],
      alpha: 0.7,
      duration: 50,
      yoyo: true,
      onComplete: () => {
        if (item.mode) {
          this.scene.start(item.scene, { mode: item.mode });
        } else {
          this.scene.start(item.scene);
        }
      },
    });
  }
}
