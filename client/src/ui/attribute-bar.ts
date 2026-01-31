import Phaser from 'phaser';

interface AttributeBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  maxValue: number;
  color: number;
}

export class AttributeBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private fillBar: Phaser.GameObjects.Rectangle;
  private labelText: Phaser.GameObjects.Text;
  private valueText: Phaser.GameObjects.Text;
  private config: AttributeBarConfig;
  private currentValue = 0;

  constructor(scene: Phaser.Scene, config: AttributeBarConfig) {
    super(scene, config.x, config.y);
    this.config = config;

    // Label
    this.labelText = scene.add.text(-5, 0, config.label, {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(1, 0.5);
    this.add(this.labelText);

    // Background bar
    this.background = scene.add.rectangle(
      config.width / 2,
      0,
      config.width,
      config.height,
      0x333333
    );
    this.add(this.background);

    // Fill bar
    this.fillBar = scene.add.rectangle(
      0,
      0,
      0,
      config.height - 2,
      config.color
    ).setOrigin(0, 0.5);
    this.add(this.fillBar);

    // Value text
    this.valueText = scene.add.text(config.width + 5, 0, '0', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add(this.valueText);

    scene.add.existing(this);
  }

  setValue(value: number, animate = true): void {
    const targetWidth = (value / this.config.maxValue) * this.config.width;

    if (animate) {
      this.scene.tweens.add({
        targets: this.fillBar,
        width: targetWidth,
        duration: 300,
        ease: 'Power2',
      });
    } else {
      this.fillBar.width = targetWidth;
    }

    this.currentValue = value;
    this.valueText.setText(value.toString());
  }

  getValue(): number {
    return this.currentValue;
  }
}

export class AttributePanel extends Phaser.GameObjects.Container {
  private bars: Map<string, AttributeBar> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const barWidth = 60;
    const barHeight = 6;
    const spacing = 14;

    const attributes = [
      { key: 'speed', label: 'SPD', color: 0x00ff88 },
      { key: 'jump', label: 'JMP', color: 0x00aaff },
      { key: 'power', label: 'PWR', color: 0xff6644 },
      { key: 'control', label: 'CTL', color: 0xffcc00 },
    ];

    attributes.forEach((attr, index) => {
      const bar = new AttributeBar(scene, {
        x: 30,
        y: index * spacing,
        width: barWidth,
        height: barHeight,
        label: attr.label,
        maxValue: 8,
        color: attr.color,
      });
      this.add(bar);
      this.bars.set(attr.key, bar);
    });

    scene.add.existing(this);
  }

  setAttributes(stats: { speed: number; jump: number; power: number; control: number }, animate = true): void {
    this.bars.get('speed')?.setValue(stats.speed, animate);
    this.bars.get('jump')?.setValue(stats.jump, animate);
    this.bars.get('power')?.setValue(stats.power, animate);
    this.bars.get('control')?.setValue(stats.control, animate);
  }
}
