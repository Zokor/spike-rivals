import Phaser from 'phaser';
import { applyPixelPerfectScaling, gameConfig } from './config';
import { BootScene, MenuScene, CharacterSelectScene, GameScene, OnlineScene, ShopScene } from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [BootScene, MenuScene, CharacterSelectScene, GameScene, OnlineScene, ShopScene],
};

const game = new Phaser.Game(config);

const applyScale = () => applyPixelPerfectScaling(game);
applyScale();

window.addEventListener('resize', applyScale);
