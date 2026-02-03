import Phaser from 'phaser';
import { getCurrencyManager } from '../managers/currency-manager';
import { getSkinManager } from '../managers/skin-manager';
import {
  type ItemType,
  type ShopItem,
  getItemsByType,
  RARITY_COLORS,
} from '../data/shop-catalog';

type TabType = 'skins' | 'balls' | 'nets' | 'effects' | 'ui';

const TAB_TO_ITEM_TYPE: Record<TabType, ItemType> = {
  skins: 'character-skin',
  balls: 'ball-skin',
  nets: 'net-skin',
  effects: 'fx-pack',
  ui: 'ui-theme',
};

export class ShopScene extends Phaser.Scene {
  private currencyText!: Phaser.GameObjects.Text;
  private currentTab: TabType = 'skins';
  private tabButtons: Map<TabType, Phaser.GameObjects.Text> = new Map();
  private itemsContainer!: Phaser.GameObjects.Container;
  private selectedItem: ShopItem | null = null;
  private detailPanel!: Phaser.GameObjects.Container;
  private currencyManager = getCurrencyManager();
  private skinManager = getSkinManager();

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, 20, 'SHOP', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);

    // Currency display
    this.currencyText = this.add.text(width - 10, 10, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    }).setOrigin(1, 0);
    this.updateCurrencyDisplay();

    // Tab buttons
    this.createTabs();

    // Items container
    this.itemsContainer = this.add.container(0, 0);

    // Detail panel (right side)
    this.detailPanel = this.add.container(0, 0);
    this.detailPanel.setVisible(false);

    // Back button
    const backButton = this.add.text(width / 2, height - 20, 'BACK', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 16, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => backButton.setStyle({ backgroundColor: '#4444aa' }));
    backButton.on('pointerout', () => backButton.setStyle({ backgroundColor: '#333366' }));
    backButton.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));

    // Show initial tab
    this.showTab(this.currentTab);
  }

  private updateCurrencyDisplay(): void {
    const coins = this.currencyManager.getCoins();
    const gems = this.currencyManager.getGems();
    this.currencyText.setText(`Coins: ${coins} | Gems: ${gems}`);
  }

  private createTabs(): void {
    const tabs: { key: TabType; label: string }[] = [
      { key: 'skins', label: 'SKINS' },
      { key: 'balls', label: 'BALLS' },
      { key: 'nets', label: 'NETS' },
      { key: 'effects', label: 'FX' },
      { key: 'ui', label: 'UI' },
    ];

    const startX = 50;
    const spacing = 70;

    tabs.forEach((tab, i) => {
      const btn = this.add.text(startX + i * spacing, 50, tab.label, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#333366',
        padding: { x: 8, y: 4 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        if (this.currentTab !== tab.key) {
          btn.setStyle({ backgroundColor: '#444488' });
        }
      });
      btn.on('pointerout', () => {
        if (this.currentTab !== tab.key) {
          btn.setStyle({ backgroundColor: '#333366' });
        }
      });
      btn.on('pointerdown', () => this.showTab(tab.key));

      this.tabButtons.set(tab.key, btn);
    });
  }

  private showTab(tab: TabType): void {
    this.currentTab = tab;
    this.selectedItem = null;
    this.detailPanel.setVisible(false);

    // Update tab button styles
    this.tabButtons.forEach((btn, key) => {
      btn.setStyle({
        backgroundColor: key === tab ? '#4444aa' : '#333366',
      });
    });

    // Clear items container
    this.itemsContainer.removeAll(true);

    // Get items for this tab
    const itemType = TAB_TO_ITEM_TYPE[tab];
    const items = getItemsByType(itemType);

    // Create item grid
    this.createItemGrid(items);
  }

  private createItemGrid(items: ShopItem[]): void {
    const startX = 30;
    const startY = 80;
    const itemWidth = 70;
    const itemHeight = 80;
    const cols = 5;
    const { height } = this.cameras.main;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * itemWidth;
      const y = startY + row * itemHeight;

      // Skip if would be below back button
      if (y + itemHeight > height - 40) return;

      const itemCard = this.createItemCard(item, x, y);
      this.itemsContainer.add(itemCard);
    });
  }

  private createItemCard(item: ShopItem, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const isOwned = this.skinManager.isOwned(item.id);
    const isEquipped = this.skinManager.isEquipped(item.id);

    // Background
    const rarityColor = RARITY_COLORS[item.rarity];
    const bg = this.add.rectangle(0, 0, 60, 70, isOwned ? 0x224422 : 0x222233, 0.8);
    bg.setStrokeStyle(2, rarityColor);
    container.add(bg);

    // Item icon placeholder
    const icon = this.add.rectangle(0, -15, 40, 40, rarityColor, 0.3);
    container.add(icon);

    // Item name
    const name = this.add.text(0, 15, item.name.split(' ')[0], {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(name);

    // Price or status
    let statusText: string;
    let statusColor: string;
    if (isEquipped) {
      statusText = 'EQUIPPED';
      statusColor = '#00ff88';
    } else if (isOwned) {
      statusText = 'OWNED';
      statusColor = '#888888';
    } else {
      statusText = `${item.price} ${item.currency === 'gems' ? 'G' : 'C'}`;
      statusColor = item.currency === 'gems' ? '#ff88ff' : '#ffcc00';
    }

    const price = this.add.text(0, 28, statusText, {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: statusColor,
    }).setOrigin(0.5);
    container.add(price);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.selectItem(item));
    bg.on('pointerover', () => bg.setFillStyle(isOwned ? 0x336633 : 0x333344, 0.9));
    bg.on('pointerout', () => bg.setFillStyle(isOwned ? 0x224422 : 0x222233, 0.8));

    return container;
  }

  private selectItem(item: ShopItem): void {
    this.selectedItem = item;
    this.showDetailPanel(item);
  }

  private showDetailPanel(item: ShopItem): void {
    this.detailPanel.removeAll(true);
    this.detailPanel.setVisible(true);

    const { width, height } = this.cameras.main;
    const panelX = width - 100;
    const panelY = height / 2 - 40;

    // Panel background
    const bg = this.add.rectangle(panelX, panelY, 180, 180, 0x222244, 0.95);
    bg.setStrokeStyle(2, RARITY_COLORS[item.rarity]);
    this.detailPanel.add(bg);

    // Item name
    const name = this.add.text(panelX, panelY - 70, item.name, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.detailPanel.add(name);

    // Rarity
    const rarityText = this.add.text(panelX, panelY - 55, item.rarity.toUpperCase(), {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: `#${RARITY_COLORS[item.rarity].toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    this.detailPanel.add(rarityText);

    // Description
    if (item.description) {
      const desc = this.add.text(panelX, panelY - 30, item.description, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#888888',
        wordWrap: { width: 160 },
      }).setOrigin(0.5);
      this.detailPanel.add(desc);
    }

    // Preview placeholder
    const preview = this.add.rectangle(panelX, panelY + 10, 60, 60, RARITY_COLORS[item.rarity], 0.3);
    this.detailPanel.add(preview);

    // Action button
    const isOwned = this.skinManager.isOwned(item.id);
    const isEquipped = this.skinManager.isEquipped(item.id);

    let buttonText: string;
    let buttonAction: () => void;
    let canPerform: boolean;

    if (isEquipped) {
      buttonText = 'EQUIPPED';
      buttonAction = () => {};
      canPerform = false;
    } else if (isOwned) {
      buttonText = 'EQUIP';
      buttonAction = () => this.equipItem(item);
      canPerform = true;
    } else {
      const currency = item.currency === 'gems' ? 'Gems' : 'Coins';
      buttonText = `BUY (${item.price} ${currency})`;
      buttonAction = () => this.buyItem(item);
      canPerform = item.currency === 'gems'
        ? this.currencyManager.canAffordGems(item.price)
        : this.currencyManager.canAffordCoins(item.price);
    }

    const actionBtn = this.add.text(panelX, panelY + 65, buttonText, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: canPerform ? '#ffffff' : '#666666',
      backgroundColor: canPerform ? '#336633' : '#333333',
      padding: { x: 12, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: canPerform });

    if (canPerform) {
      actionBtn.on('pointerover', () => actionBtn.setStyle({ backgroundColor: '#448844' }));
      actionBtn.on('pointerout', () => actionBtn.setStyle({ backgroundColor: '#336633' }));
      actionBtn.on('pointerdown', buttonAction);
    }

    this.detailPanel.add(actionBtn);
  }

  private buyItem(item: ShopItem): void {
    const success = item.currency === 'gems'
      ? this.currencyManager.spendGems(item.price)
      : this.currencyManager.spendCoins(item.price);

    if (success) {
      this.skinManager.addOwned(item.id);
      this.updateCurrencyDisplay();
      this.showTab(this.currentTab); // Refresh grid
      this.showFeedback('PURCHASED!', '#00ff88');
    } else {
      this.showFeedback('NOT ENOUGH!', '#ff6688');
    }
  }

  private equipItem(item: ShopItem): void {
    this.skinManager.equip(item.id);
    this.showTab(this.currentTab); // Refresh grid
    this.showFeedback('EQUIPPED!', '#00ff88');
  }

  private showFeedback(message: string, color: string): void {
    const { width, height } = this.cameras.main;
    const text = this.add.text(width / 2, height / 2, message, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 30,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }
}
