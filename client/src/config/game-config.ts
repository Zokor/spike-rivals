import Phaser from 'phaser';
import { PHYSICS } from '@spike-rivals/shared';

export const GAME_WIDTH = PHYSICS.COURT_WIDTH; // 480
export const GAME_HEIGHT = PHYSICS.COURT_HEIGHT; // 270

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY },
      debug: import.meta.env.DEV,
    },
  },
  backgroundColor: '#1a1a2e',
};
