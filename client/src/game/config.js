import Phaser from 'phaser';
import BootScene from './BootScene';
import GameScene from './GameScene';
import ResultScene from './ResultScene';

export const TILE_SIZE = 48;
export const COLORS = {
  WALL: 0x2c3e50,
  DESTRUCTIBLE: 0x8e6b3e,
  EMPTY: 0x1e3a2f,
  WATER: 0x4A90D9,
  STEAM: 0xe8f4f8,
  SHIELD: 0xf1c40f,
  UI_BG: 0x1a1a2e,
  SCORE_TEXT: 0xf1c40f,
};

export function createPhaserConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [BootScene, GameScene, ResultScene],
    audio: {
      disableWebAudio: false,
    },
  };
}
