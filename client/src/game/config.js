import Phaser from 'phaser';
import BootScene from './BootScene';
import GameScene from './GameScene';

export const isTouchDevice = () => typeof window !== 'undefined'
  && window.matchMedia?.('(pointer: coarse)').matches;

// Below this width the scoreboard sits in a strip above the board instead of beside it.
export const NARROW_WIDTH = 900;

// Room kept clear of the board for the HUD around it and the touch controls below it.
export function boardInsets(viewWidth) {
  const narrow = viewWidth < NARROW_WIDTH;
  return {
    top: narrow ? 104 : 72,
    bottom: isTouchDevice() ? 190 : 20,
    side: narrow ? 8 : 232,
  };
}

// Biggest tile size that fits the maze inside the space left between the insets.
export function boardLayout(maze, viewWidth, viewHeight) {
  const { top, bottom, side } = boardInsets(viewWidth);
  const tile = Math.max(16, Math.min(64, Math.floor(Math.min(
    (viewWidth - 2 * side) / maze.width,
    (viewHeight - top - bottom) / maze.height,
  ))));
  return {
    tile,
    offsetX: Math.round((viewWidth - maze.width * tile) / 2),
    offsetY: Math.round(top + (viewHeight - top - bottom - maze.height * tile) / 2),
  };
}

export function createPhaserConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#12152a',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, GameScene],
    audio: { noAudio: true },
  };
}
