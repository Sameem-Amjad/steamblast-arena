import Phaser from 'phaser';
import { AVATAR_DEFAULTS } from 'steamblast-shared/gameConstants';
import { POWERUP_STYLE } from './powerups';

// Every texture is drawn here at 64px and scaled to the board, so the game needs no image files.
export const T = 64;

const hex = (color) => parseInt(color.replace('#', ''), 16);

function shade(color, amount) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * amount)));
  return Phaser.Display.Color.GetColor(f(c.red), f(c.green), f(c.blue));
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this._tiles();
    AVATAR_DEFAULTS.forEach((a, i) => {
      this._character(`player_${i}`, hex(a.color), false);
      this._character(`bot_${i}`, hex(a.color), true);
    });
    this._effects();
    this.scene.start('GameScene');
  }

  _draw(key, size, paint) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    paint(g);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  _tiles() {
    for (const [key, base, top] of [['floor_a', 0x1b5a47, 0x206b54], ['floor_b', 0x1a5242, 0x1e624e]]) {
      this._draw(key, T, (g) => {
        g.fillStyle(base); g.fillRect(0, 0, T, T);
        g.fillStyle(top); g.fillRoundedRect(3, 3, T - 6, T - 6, 9);
        g.fillStyle(0xffffff, 0.05); g.fillRoundedRect(7, 7, T - 14, (T - 14) / 2, 6);
      });
    }

    // Stone pillar: can't be sprayed through.
    this._draw('wall', T, (g) => {
      g.fillStyle(0x223044); g.fillRect(0, 0, T, T);
      g.fillStyle(0x4a5d78); g.fillRoundedRect(2, 2, T - 4, T - 4, 9);
      g.fillStyle(0x5f7594); g.fillRoundedRect(2, 2, T - 4, (T - 4) * 0.48, 9);
      g.fillStyle(0x3a4a61); g.fillRoundedRect(8, T * 0.58, T - 16, T * 0.26, 5);
      g.fillStyle(0x9db1cc);
      for (const [x, y] of [[12, 12], [T - 12, 12], [12, T - 12], [T - 12, T - 12]]) g.fillCircle(x, y, 3);
    });

    // Wooden crate: one splash breaks it and may reveal a power-up.
    this._draw('crate', T, (g) => {
      g.fillStyle(0x1b5a47); g.fillRect(0, 0, T, T);
      g.fillStyle(0x6e4522); g.fillRoundedRect(3, 3, T - 6, T - 6, 7);
      g.fillStyle(0xc68d4b); g.fillRoundedRect(7, 7, T - 14, T - 14, 4);
      g.lineStyle(4, 0x94612f);
      g.lineBetween(8, T / 3 + 1, T - 8, T / 3 + 1);
      g.lineBetween(8, (2 * T) / 3 - 1, T - 8, (2 * T) / 3 - 1);
      g.lineStyle(6, 0x8a5a2b); g.lineBetween(12, 12, T - 12, T - 12);
      g.lineStyle(2, 0x5a3a1c); g.strokeRoundedRect(7, 7, T - 14, T - 14, 4);
      g.fillStyle(0xffffff, 0.12); g.fillRoundedRect(9, 9, T - 18, 8, 3);
    });
  }

  _character(key, color, isBot) {
    const c = T / 2;
    this._draw(key, T, (g) => {
      g.fillStyle(0x000000, 0.28); g.fillEllipse(c, T - 7, 40, 10);
      if (isBot) {
        g.lineStyle(3, shade(color, 0.6)); g.lineBetween(c, 12, c, 4);
        g.fillStyle(0xfff36b); g.fillCircle(c, 5, 4);
      }
      g.fillStyle(shade(color, 0.62)); g.fillCircle(c, c + 3, 25);
      g.fillStyle(color); g.fillCircle(c, c + 1, 23.5);
      g.fillStyle(0xffffff, 0.35); g.fillEllipse(c - 8, c - 11, 17, 9);

      if (isBot) {
        g.fillStyle(0x1a1a2e, 0.9); g.fillRoundedRect(c - 16, c - 6, 32, 13, 6);
        g.fillStyle(0x7cf7ff); g.fillCircle(c - 8, c, 3.5); g.fillCircle(c + 8, c, 3.5);
        g.lineStyle(2.5, 0x1a1a2e); g.lineBetween(c - 6, c + 13, c + 6, c + 13);
      } else {
        g.fillStyle(0xffffff); g.fillCircle(c - 9, c - 2, 7); g.fillCircle(c + 9, c - 2, 7);
        g.fillStyle(0x1a1a2e); g.fillCircle(c - 8, c - 1, 3.6); g.fillCircle(c + 10, c - 1, 3.6);
        g.fillStyle(0xffffff); g.fillCircle(c - 7, c - 3, 1.2); g.fillCircle(c + 11, c - 3, 1.2);
        g.fillStyle(0xff7aa2, 0.55); g.fillCircle(c - 16, c + 8, 4); g.fillCircle(c + 16, c + 8, 4);
        g.lineStyle(3, 0x1a1a2e);
        g.beginPath(); g.arc(c, c + 6, 7, 0.25, Math.PI - 0.25); g.strokePath();
      }
    });
  }

  _effects() {
    // Water balloon, waiting to burst.
    this._draw('balloon', T, (g) => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(32, 56, 30, 8);
      g.fillStyle(0x1f6fd1); g.fillCircle(32, 37, 19);
      g.fillStyle(0x4aa3ff); g.fillCircle(32, 35, 17);
      g.fillTriangle(32, 9, 21, 27, 43, 27);
      g.fillStyle(0x1f6fd1); g.fillTriangle(29, 9, 35, 9, 32, 4);
      g.fillStyle(0xffffff, 0.75); g.fillEllipse(25, 31, 7, 12);
    });

    // Soaked tile.
    this._draw('splash', T, (g) => {
      g.fillStyle(0x2f8cf0, 0.9); g.fillRoundedRect(1, 1, T - 2, T - 2, 18);
      g.fillStyle(0x8fd0ff, 0.95); g.fillRoundedRect(9, 9, T - 18, T - 18, 13);
      g.fillStyle(0xffffff, 0.85);
      for (const [x, y, r] of [[18, 20, 4], [44, 16, 3], [40, 44, 5], [22, 46, 3], [32, 30, 2.5]]) g.fillCircle(x, y, r);
    });

    // Where a balloon is about to burst.
    this._draw('warn', T, (g) => {
      g.fillStyle(0x4aa3ff, 0.28); g.fillRoundedRect(4, 4, T - 8, T - 8, 12);
      g.lineStyle(2, 0x8fd0ff, 0.6); g.strokeRoundedRect(4, 4, T - 8, T - 8, 12);
    });

    this._draw('puff', T, (g) => {
      for (const [r, a] of [[30, 0.12], [24, 0.22], [17, 0.4], [10, 0.6]]) {
        g.fillStyle(0xffffff, a); g.fillCircle(32, 32, r);
      }
    });

    this._draw('shield', T, (g) => {
      g.fillStyle(0xf9d342, 0.14); g.fillCircle(32, 32, 30);
      g.lineStyle(4, 0xf9d342, 0.95); g.strokeCircle(32, 32, 29);
    });

    this._draw('chunk', 16, (g) => {
      g.fillStyle(0xc68d4b); g.fillRect(0, 0, 10, 10);
      g.fillStyle(0x8a5a2b); g.fillRect(0, 7, 10, 3);
    });

    for (const [type, { color }] of Object.entries(POWERUP_STYLE)) {
      this._draw(`pu_${type}`, T, (g) => {
        g.fillStyle(0x000000, 0.25); g.fillEllipse(32, 56, 34, 8);
        g.fillStyle(0xffffff); g.fillCircle(32, 30, 23);
        g.fillStyle(color); g.fillCircle(32, 30, 19.5);
        g.fillStyle(0xffffff, 0.3); g.fillEllipse(25, 21, 14, 8);
      });
    }
  }
}
