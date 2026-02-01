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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
    zoom: 1,
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

export function getIntegerZoom(parentWidth: number, parentHeight: number): number {
  const zoomX = Math.floor(parentWidth / GAME_WIDTH);
  const zoomY = Math.floor(parentHeight / GAME_HEIGHT);
  return Math.max(1, Math.min(zoomX, zoomY));
}

export function applyPixelPerfectScaling(game: Phaser.Game): void {
  const parent = game.scale.parent;
  const parentElement =
    typeof parent === 'string' ? document.getElementById(parent) : parent;
  const parentWidth = parentElement?.clientWidth ?? window.innerWidth;
  const parentHeight = parentElement?.clientHeight ?? window.innerHeight;

  const zoom = getIntegerZoom(parentWidth, parentHeight);
  if (game.scale.zoom !== zoom) {
    game.scale.setZoom(zoom);
    game.scale.refresh();
  }
}
