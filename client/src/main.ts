import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene, MenuScene, CharacterSelectScene, GameScene, OnlineScene, ShopScene } from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [BootScene, MenuScene, CharacterSelectScene, GameScene, OnlineScene, ShopScene],
};

new Phaser.Game(config);
