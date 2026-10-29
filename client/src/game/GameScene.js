import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { emit } from '../networking/gameSync';
import { boardLayout } from './config';
import { T } from './BootScene';
import { POWERUP_STYLE } from './powerups';
import { TILE, MOVE_INTERVAL } from 'steamblast-shared/gameConstants';

// Draws the board from the game store and sends the local player's input. The server owns the
// game; this scene only mirrors what it reports.
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this._tiles = [];
    this._players = {};
    this._sprays = {};
    this._powerUps = {};
    this._seenEffects = new Set();
    this._gameId = null;
    this._layout = null;
    this._lastMoveTime = 0;
    this._lastTouchSpray = 0;

    this._cursors = this.input.keyboard.createCursorKeys();
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this._unsubscribe = useGameStore.subscribe((state, prev) => this._onState(state, prev));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this._unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this._unsubscribe?.());
    this.scale.on('resize', () => this._rebuild());

    this._rebuild();
  }

  // ── State → sprites ────────────────────────────────────────────────────

  _onState(state, prev) {
    if (!state.maze) {
      if (this._gameId !== null) this._clearBoard();
      return;
    }
    if (state.gameId !== this._gameId) {
      this._rebuild();
      return;
    }
    if (state.maze !== prev.maze) this._updateTiles(state.maze.grid, prev.maze?.grid);
    if (state.powerUps !== prev.powerUps) this._syncPowerUps(state.powerUps);
    if (state.sprays !== prev.sprays) this._syncSprays(state.sprays);
    if (state.players !== prev.players) this._syncPlayers(state.players, state.mySocketId);
    if (state.effects !== prev.effects) this._playEffects(state.effects);
  }

  _clearBoard() {
    this._tiles.flat().forEach((s) => s.destroy());
    this._tiles = [];
    for (const group of [this._players, this._powerUps]) {
      Object.values(group).forEach((o) => o.container.destroy());
    }
    Object.values(this._sprays).forEach((s) => this._destroySpray(s));
    this._players = {};
    this._powerUps = {};
    this._sprays = {};
    this._gameId = null;
  }

  _rebuild() {
    const state = useGameStore.getState();
    this._clearBoard();
    if (!state.maze) return;
    this._gameId = state.gameId;
    this._layout = boardLayout(state.maze, this.scale.width, this.scale.height);
    const { width, height, grid } = state.maze;
    for (let y = 0; y < height; y++) {
      this._tiles[y] = [];
      for (let x = 0; x < width; x++) {
        const img = this.add.image(0, 0, this._tileKey(grid[y][x], x, y)).setDepth(0);
        this._place(img, x, y);
        this._tiles[y][x] = img;
      }
    }
    this._syncPowerUps(state.powerUps);
    this._syncSprays(state.sprays);
    this._syncPlayers(state.players, state.mySocketId);
    state.effects.forEach((e) => this._seenEffects.add(e.id));
  }

  _tileKey(tile, x, y) {
    if (tile === TILE.WALL) return 'wall';
    if (tile === TILE.DESTRUCTIBLE) return 'crate';
    return (x + y) % 2 ? 'floor_b' : 'floor_a';
  }

  _center(x, y) {
    const { tile, offsetX, offsetY } = this._layout;
    return { cx: offsetX + x * tile + tile / 2, cy: offsetY + y * tile + tile / 2 };
  }

  _place(obj, x, y, scale = 1) {
    const { cx, cy } = this._center(x, y);
    obj.setPosition(cx, cy);
    obj.setScale((this._layout.tile / T) * scale);
    return obj;
  }

  _updateTiles(grid, prevGrid) {
    for (let y = 0; y < grid.length; y++) {
      if (prevGrid && grid[y] === prevGrid[y]) continue;
      for (let x = 0; x < grid[y].length; x++) {
        if (prevGrid && grid[y][x] === prevGrid[y][x]) continue;
        this._tiles[y]?.[x]?.setTexture(this._tileKey(grid[y][x], x, y));
        if (prevGrid?.[y][x] === TILE.DESTRUCTIBLE) this._crateBurst(x, y);
      }
    }
  }

  _syncPlayers(players, myId) {
    const now = Date.now();
    for (const [id, p] of Object.entries(players)) {
      let view = this._players[id];
      if (!view) {
        const body = this.add.image(0, 0, `${p.isBot ? 'bot' : 'player'}_${(p.colorIndex || 0) % 8}`);
        const ring = this.add.image(0, 0, 'shield').setVisible(false);
        const label = this.add.text(0, 0, id === myId ? `★ ${p.displayName}` : p.displayName, {
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          color: id === myId ? '#ffe066' : '#ffffff',
          stroke: '#0b0d1c',
          strokeThickness: 5,
        }).setOrigin(0.5, 1);
        const container = this.add.container(0, 0, [ring, body, label]);
        view = { container, body, ring, label, x: p.x, y: p.y };
        this._players[id] = view;
        this._layoutPlayer(view);
        const { cx, cy } = this._center(p.x, p.y);
        container.setPosition(cx, cy);
      }

      if (view.x !== p.x || view.y !== p.y) {
        const { cx, cy } = this._center(p.x, p.y);
        const jump = Math.abs(view.x - p.x) + Math.abs(view.y - p.y) > 1;
        view.x = p.x;
        view.y = p.y;
        this.tweens.killTweensOf(view.container);
        if (jump) view.container.setPosition(cx, cy);
        else this.tweens.add({ targets: view.container, x: cx, y: cy, duration: 110, ease: 'Sine.easeOut' });
      }

      const steamed = p.inChamber || !p.alive;
      view.container.setAlpha(steamed ? 0.28 : 1);
      view.container.setDepth(10 + p.y);
      view.shieldUntil = p.shieldUntil || 0;
      view.ring.setVisible(!steamed && view.shieldUntil > now);
    }

    for (const id of Object.keys(this._players)) {
      if (!players[id]) {
        this._players[id].container.destroy();
        delete this._players[id];
      }
    }
  }

  _layoutPlayer(view) {
    const s = this._layout.tile / T;
    view.body.setScale(s * 0.92);
    view.ring.setScale(s * 1.05);
    view.label.setScale(Math.max(0.42, s * 0.62));
    view.label.setY(-this._layout.tile * 0.42);
  }

  _syncSprays(sprays) {
    for (const [id, spray] of Object.entries(sprays)) {
      let view = this._sprays[id];
      if (!view) {
        view = { state: null, warn: [], splash: [], balloon: null };
        this._sprays[id] = view;
      }
      if (view.state === spray.state) continue;
      view.state = spray.state;

      if (spray.state === 'pending') {
        view.warn = (spray.tiles || []).map((t) => this._place(this.add.image(0, 0, 'warn').setDepth(2), t.x, t.y));
        this.tweens.add({ targets: view.warn, alpha: { from: 0.35, to: 1 }, duration: 260, yoyo: true, repeat: -1 });
        view.balloon = this._place(this.add.image(0, 0, 'balloon').setDepth(5), spray.x, spray.y, 0.8);
        const s = view.balloon.scale;
        this.tweens.add({ targets: view.balloon, scale: s * 1.15, duration: 200, yoyo: true, repeat: -1 });
      } else if (spray.state === 'burst') {
        view.warn.forEach((w) => w.destroy());
        view.warn = [];
        view.balloon?.destroy();
        view.balloon = null;
        view.splash = spray.tiles.map((t) => {
          const img = this._place(this.add.image(0, 0, 'splash').setDepth(6), t.x, t.y, 0.4);
          this.tweens.add({ targets: img, scale: (this._layout.tile / T) * 1.02, duration: 140, ease: 'Back.easeOut' });
          this.tweens.add({ targets: img, alpha: 0, delay: 380, duration: 320 });
          return img;
        });
      }
    }

    for (const id of Object.keys(this._sprays)) {
      if (!sprays[id]) {
        this._destroySpray(this._sprays[id]);
        delete this._sprays[id];
      }
    }
  }

  _destroySpray(view) {
    [...view.warn, ...view.splash, view.balloon].forEach((o) => o?.destroy());
  }

  _syncPowerUps(powerUps) {
    for (const [k, pu] of Object.entries(powerUps)) {
      if (this._powerUps[k]) continue;
      const style = POWERUP_STYLE[pu.type] || POWERUP_STYLE.extra_water;
      const disc = this.add.image(0, 0, `pu_${pu.type}`);
      const icon = this.add.text(0, -2, style.icon, { fontSize: '30px' }).setOrigin(0.5);
      const container = this.add.container(0, 0, [disc, icon]).setDepth(3);
      this._place(container, pu.x, pu.y, 0.85);
      const s = container.scale;
      container.setScale(0);
      this.tweens.add({ targets: container, scale: s, duration: 260, ease: 'Back.easeOut' });
      this.tweens.add({ targets: icon, y: -6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this._powerUps[k] = { container, x: pu.x, y: pu.y };
    }
    for (const [k, view] of Object.entries(this._powerUps)) {
      if (powerUps[k]) continue;
      delete this._powerUps[k];
      this.tweens.add({
        targets: view.container,
        scale: view.container.scale * 1.6,
        alpha: 0,
        duration: 220,
        onComplete: () => view.container.destroy(),
      });
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────

  _playEffects(effects) {
    for (const e of effects) {
      if (this._seenEffects.has(e.id)) continue;
      this._seenEffects.add(e.id);
      if (e.type === 'steam') this._steamPuff(e.x, e.y, e.mine);
      if (e.type === 'pickup') this._floatText(e.x, e.y, e.text, '#ffe066');
    }
  }

  _steamPuff(x, y, mine) {
    const { cx, cy } = this._center(x, y);
    const s = this._layout.tile / T;
    for (let i = 0; i < 7; i++) {
      const puff = this.add.image(cx + (Math.random() - 0.5) * this._layout.tile * 0.6, cy, 'puff')
        .setDepth(40).setScale(s * (0.5 + Math.random() * 0.4));
      this.tweens.add({
        targets: puff,
        y: cy - this._layout.tile * (0.8 + Math.random()),
        scale: puff.scale * 2,
        alpha: 0,
        duration: 900 + Math.random() * 500,
        ease: 'Sine.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    this._floatText(x, y, 'STEAMED!', '#e8f4f8');
    if (mine) this.cameras.main.shake(220, 0.008);
  }

  _crateBurst(x, y) {
    const { cx, cy } = this._center(x, y);
    const s = this._layout.tile / T;
    for (let i = 0; i < 6; i++) {
      const chunk = this.add.image(cx, cy, 'chunk').setDepth(7).setScale(s * 1.4).setAngle(Math.random() * 90);
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: chunk,
        x: cx + Math.cos(a) * this._layout.tile * 0.7,
        y: cy + Math.sin(a) * this._layout.tile * 0.7,
        angle: chunk.angle + 180,
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => chunk.destroy(),
      });
    }
  }

  _floatText(x, y, text, color) {
    const { cx, cy } = this._center(x, y);
    const label = this.add.text(cx, cy - this._layout.tile * 0.4, text, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color,
      stroke: '#0b0d1c',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50).setScale(Math.max(0.45, this._layout.tile / T * 0.7));
    this.tweens.add({
      targets: label,
      y: label.y - this._layout.tile * 0.9,
      alpha: 0,
      delay: 350,
      duration: 700,
      onComplete: () => label.destroy(),
    });
  }

  // ── Input ──────────────────────────────────────────────────────────────

  update(time) {
    const now = Date.now();
    for (const view of Object.values(this._players)) {
      if (view.ring.visible && now > view.shieldUntil) view.ring.setVisible(false);
    }

    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;
    const me = state.players[state.mySocketId];
    if (!me || !me.alive || me.inChamber) return;

    const interval = MOVE_INTERVAL / (me.speed || 1);
    if (time - this._lastMoveTime >= interval) {
      let dir = state.touch.dir;
      if (this._cursors.up.isDown || this._wasd.up.isDown) dir = 'up';
      else if (this._cursors.down.isDown || this._wasd.down.isDown) dir = 'down';
      else if (this._cursors.left.isDown || this._wasd.left.isDown) dir = 'left';
      else if (this._cursors.right.isDown || this._wasd.right.isDown) dir = 'right';

      if (dir) {
        emit.move(dir);
        this._lastMoveTime = time;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this._spaceKey) || state.touch.sprayAt > this._lastTouchSpray) {
      this._lastTouchSpray = state.touch.sprayAt;
      emit.spray();
    }
  }
}
