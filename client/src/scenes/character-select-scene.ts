import Phaser from 'phaser';
import { Character, CHARACTER_INFO, type CharacterId } from '@spike-rivals/shared';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { CharacterPortrait } from '../ui/character-portrait';
import { AttributePanel } from '../ui/attribute-bar';

const ALL_CHARACTER_IDS: CharacterId[] = ['blitz', 'crusher', 'sky', 'zen', 'tank', 'flash', 'nova', 'ghost'];

interface SceneData {
  mode: 'cpu' | 'quick' | 'ranked' | 'private';
  onSelect?: (characterId: CharacterId) => void;
}

export class CharacterSelectScene extends Phaser.Scene {
  private portraits: CharacterPortrait[] = [];
  private attributePanel!: AttributePanel;
  private characterName!: Phaser.GameObjects.Text;
  private characterDescription!: Phaser.GameObjects.Text;
  private playstyleText!: Phaser.GameObjects.Text;
  private selectButton!: Phaser.GameObjects.Text;
  private previewSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  private previewX = 0;
  private previewY = 0;

  private selectedIndex = 0;
  private selectedCharacterId: CharacterId = 'nova';
  private mode: SceneData['mode'] = 'cpu';
  private onSelectCallback?: (characterId: CharacterId) => void;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private enterKey: Phaser.Input.Keyboard.Key | null = null;
  private escKey: Phaser.Input.Keyboard.Key | null = null;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data: SceneData): void {
    this.mode = data.mode || 'cpu';
    this.onSelectCallback = data.onSelect;

    // Load saved character from localStorage
    const saved = localStorage.getItem('spike-rivals-character');
    if (saved && ALL_CHARACTER_IDS.includes(saved as CharacterId)) {
      this.selectedCharacterId = saved as CharacterId;
      this.selectedIndex = ALL_CHARACTER_IDS.indexOf(this.selectedCharacterId);
    }
  }

  create(): void {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // Title
    this.add.text(GAME_WIDTH / 2, 20, 'SELECT CHARACTER', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Create character grid (4x2)
    this.createCharacterGrid();

    // Create preview area
    this.createPreviewArea();

    // Create attribute panel
    this.attributePanel = new AttributePanel(this, GAME_WIDTH - 110, 100);

    // Create select button
    this.createSelectButton();

    // Setup input
    this.setupInput();

    // Select initial character
    this.selectCharacter(this.selectedIndex);

    // Back button hint
    this.add.text(10, GAME_HEIGHT - 15, 'ESC: Back', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#666666',
    });
  }

  private createCharacterGrid(): void {
    const gridStartX = 30;
    const gridStartY = 55;
    const portraitSize = 32;
    const spacing = 8;
    const columns = 4;

    // TODO: Get unlocked characters from server/localStorage
    const unlockedCharacters = new Set<CharacterId>(ALL_CHARACTER_IDS); // All unlocked for now

    ALL_CHARACTER_IDS.forEach((charId, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      const x = gridStartX + col * (portraitSize + spacing) + portraitSize / 2;
      const y = gridStartY + row * (portraitSize + spacing) + portraitSize / 2;

      const portrait = new CharacterPortrait(this, {
        x,
        y,
        characterId: charId,
        size: portraitSize,
        isLocked: !unlockedCharacters.has(charId),
      });

      portrait.on('pointerdown', () => {
        if (!portrait.getIsLocked()) {
          this.selectCharacter(index);
        }
      });

      this.portraits.push(portrait);
    });
  }

  private createPreviewArea(): void {
    this.previewX = GAME_WIDTH / 2 + 40;
    this.previewY = 100;

    // Preview box background
    this.add.rectangle(this.previewX, this.previewY, 80, 100, 0x222233);

    // Character preview - will be created/updated in updatePreview
    // Start with a placeholder rectangle
    this.previewSprite = this.add.rectangle(this.previewX, this.previewY, 48, 64, 0x00ff88);

    // Character name
    this.characterName = this.add.text(this.previewX, this.previewY + 60, 'Nova', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Description (below the grid)
    this.characterDescription = this.add.text(GAME_WIDTH / 2, 175, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
      wordWrap: { width: 200 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // Playstyle
    this.playstyleText = this.add.text(GAME_WIDTH / 2, 195, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5, 0);
  }

  private createSelectButton(): void {
    this.selectButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, 'SELECT', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00aa66',
      padding: { x: 30, y: 8 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.selectButton.on('pointerover', () => {
      this.selectButton.setStyle({ backgroundColor: '#00cc77' });
    });

    this.selectButton.on('pointerout', () => {
      this.selectButton.setStyle({ backgroundColor: '#00aa66' });
    });

    this.selectButton.on('pointerdown', () => {
      this.confirmSelection();
    });
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Keyboard navigation
    keyboard.on('keydown-LEFT', () => this.navigate(-1, 0));
    keyboard.on('keydown-RIGHT', () => this.navigate(1, 0));
    keyboard.on('keydown-UP', () => this.navigate(0, -1));
    keyboard.on('keydown-DOWN', () => this.navigate(0, 1));

    keyboard.on('keydown-ENTER', () => this.confirmSelection());
    keyboard.on('keydown-SPACE', () => this.confirmSelection());
    keyboard.on('keydown-ESC', () => this.goBack());
  }

  private navigate(dx: number, dy: number): void {
    const columns = 4;
    const rows = 2;

    let col = this.selectedIndex % columns;
    let row = Math.floor(this.selectedIndex / columns);

    col = (col + dx + columns) % columns;
    row = (row + dy + rows) % rows;

    const newIndex = row * columns + col;

    // Skip locked characters
    if (!this.portraits[newIndex].getIsLocked()) {
      this.selectCharacter(newIndex);
    }
  }

  private selectCharacter(index: number): void {
    // Deselect previous
    if (this.portraits[this.selectedIndex]) {
      this.portraits[this.selectedIndex].deselect();
    }

    this.selectedIndex = index;
    this.selectedCharacterId = ALL_CHARACTER_IDS[index];

    // Select new
    this.portraits[index].select();

    // Update preview
    this.updatePreview();
  }

  private updatePreview(): void {
    const charId = this.selectedCharacterId;
    const character = Character.fromId(charId);
    const info = CHARACTER_INFO[charId];

    // Update name
    this.characterName.setText(info.name.toUpperCase());

    // Update description
    this.characterDescription.setText(info.description);
    this.playstyleText.setText(info.playstyle);

    // Update attributes with animation
    this.attributePanel.setAttributes({
      speed: character.speed,
      jump: character.jump,
      power: character.power,
      control: character.control,
    });

    // Update preview sprite
    const textureKey = `char-${charId}`;

    // Destroy old preview sprite
    if (this.previewSprite) {
      this.previewSprite.destroy();
    }

    if (this.textures.exists(textureKey)) {
      // Use actual character sprite
      this.previewSprite = this.add.sprite(this.previewX, this.previewY, textureKey, 0);
      // Scale to fit preview area (sprite is 24x32, we want ~48x64)
      this.previewSprite.setScale(2);
    } else {
      // Fallback to placeholder rectangle with character color
      const colors: Record<CharacterId, number> = {
        blitz: 0x00ff88,
        crusher: 0xff4444,
        sky: 0x44aaff,
        zen: 0xffcc00,
        tank: 0x888888,
        flash: 0xffff00,
        nova: 0xff88ff,
        ghost: 0x8844ff,
      };
      this.previewSprite = this.add.rectangle(this.previewX, this.previewY, 48, 64, colors[charId]);
    }

    // Animate preview
    this.tweens.add({
      targets: this.previewSprite,
      alpha: 0.7,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });
  }

  private confirmSelection(): void {
    // Save to localStorage
    localStorage.setItem('spike-rivals-character', this.selectedCharacterId);

    // Play selection animation
    this.tweens.add({
      targets: this.selectButton,
      alpha: 0.7,
      duration: 50,
      yoyo: true,
      onComplete: () => {
        // Callback if provided
        if (this.onSelectCallback) {
          this.onSelectCallback(this.selectedCharacterId);
        }

        // Go to game scene
        this.scene.start('GameScene', {
          mode: this.mode,
          characterId: this.selectedCharacterId,
        });
      },
    });

    // TODO: Sync with server if online
    this.syncWithServer();
  }

  private async syncWithServer(): Promise<void> {
    // TODO: Implement when auth is ready
    const token = localStorage.getItem('spike-rivals-token');
    if (!token) return;

    try {
      await fetch('/api/user/character', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId: this.selectedCharacterId }),
      });
    } catch {
      // Silently fail, local save is enough
    }
  }

  private goBack(): void {
    this.scene.start('MenuScene');
  }
}
