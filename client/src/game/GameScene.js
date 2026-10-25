import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { emit } from '../networking/gameSync';
import { TILE_SIZE, COLORS } from './config';
import { TILE, AVATAR_DEFAULTS } from 'steamblast-shared';

const PLAYER_COLORS = AVATAR_DEFAULTS.map((a) => parseInt(a.color.replace('#', '0x')));

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this._tileSprites = [];
    this._playerSprites = {};
    this._spraySprites = {};
    this._powerupSprites = {};
    this._nameTexts = {};
    this._storeUnsub = null;
    this._mySocketId = null;
    this._cursors = null;
    this._spaceKey = null;
    this._wasd = null;
    this._lastMoveTime = 0;
    this._lastSprayTime = 0;
    this._hud = {};
    this._inputBuffer = null;
    this._prevState = null;
    this._touchControls = null;
  }

  create() {
    this._cursors = this.input.keyboard.createCursorKeys();
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this._createHUD();
    this._setupTouchControls();
    this._subscribeToStore();
  }

  _subscribeToStore() {
    const store = useGameStore;
    let prev = store.getState();

    this._storeUnsub = store.subscribe((state) => {
      if (state.maze && state.maze !== prev.maze) {
        this._renderMaze(state.maze);
      }
      if (state.players !== prev.players) {
        this._syncPlayers(state.players);
      }
      if (state.timeRemaining !== prev.timeRemaining) {
        this._updateTimer(state.timeRemaining);
      }
      prev = state;
    });
  }

  _renderMaze(maze) {
    // Clear old tiles
    this._tileSprites.forEach((row) => row.forEach((s) => s?.destroy()));
    this._tileSprites = [];
    Object.values(this._powerupSprites).forEach((s) => s?.destroy());
    this._powerupSprites = {};

    const { width, height, grid } = maze;
    const offsetX = (this.scale.width - width * TILE_SIZE) / 2;
    const offsetY = 60;

    for (let y = 0; y < height; y++) {
      this._tileSprites[y] = [];
      for (let x = 0; x < width; x++) {
        const tile = grid[y][x];
        const key = tile === TILE.WALL ? 'tile_wall'
          : tile === TILE.DESTRUCTIBLE ? 'tile_destructible'
          : 'tile_empty';
        const sprite = this.add.image(
          offsetX + x * TILE_SIZE + TILE_SIZE / 2,
          offsetY + y * TILE_SIZE + TILE_SIZE / 2,
          key
        );
        this._tileSprites[y][x] = sprite;
      }
    }
  }

  _syncPlayers(players) {
    const maze = useGameStore.getState().maze;
    if (!maze) return;
    const offsetX = (this.scale.width - maze.width * TILE_SIZE) / 2;
    const offsetY = 60;

    for (const [socketId, player] of Object.entries(players)) {
      const wx = offsetX + player.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = offsetY + player.y * TILE_SIZE + TILE_SIZE / 2;

      if (!this._playerSprites[socketId]) {
        // Create player sprite
        const colorIdx = Object.keys(players).indexOf(socketId) % PLAYER_COLORS.length;
        const sprite = this.add.image(wx, wy, 'player');
        sprite.setTint(PLAYER_COLORS[colorIdx]);
        sprite.setDepth(10);
        this._playerSprites[socketId] = sprite;

        const nameText = this.add.text(wx, wy - 30, player.displayName, {
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#00000066',
          padding: { x: 3, y: 1 },
        });
        nameText.setOrigin(0.5, 1);
        nameText.setDepth(11);
        this._nameTexts[socketId] = nameText;
      } else {
        const sprite = this._playerSprites[socketId];
        // Tween for smooth movement
        this.tweens.add({ targets: sprite, x: wx, y: wy, duration: 80, ease: 'Linear' });
        const nameText = this._nameTexts[socketId];
        if (nameText) {
          this.tweens.add({ targets: nameText, x: wx, y: wy - 30, duration: 80, ease: 'Linear' });
        }
        if (player.inChamber || !player.alive) {
          sprite.setAlpha(0.3);
        } else {
          sprite.setAlpha(player.hasShield ? 0.7 : 1.0);
          if (player.hasShield) {
            sprite.setTint(0xf1c40f);
          }
        }
      }
    }

    // Remove disconnected players
    for (const socketId of Object.keys(this._playerSprites)) {
      if (!players[socketId]) {
        this._playerSprites[socketId]?.destroy();
        this._nameTexts[socketId]?.destroy();
        delete this._playerSprites[socketId];
        delete this._nameTexts[socketId];
      }
    }
  }

  _createHUD() {
    const timerBg = this.add.rectangle(this.scale.width / 2, 24, 120, 36, 0x000000, 0.7);
    timerBg.setDepth(20);
    this._hud.timer = this.add.text(this.scale.width / 2, 24, '2:00', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(21);
  }

  _updateTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const text = `${m}:${s.toString().padStart(2, '0')}`;
    if (this._hud.timer) {
      this._hud.timer.setText(text);
      if (seconds < 30) this._hud.timer.setColor('#e74c3c');
    }
  }

  _setupTouchControls() {
    if (!('ontouchstart' in window)) return;
    const btnSize = 60;
    const margin = 20;
    const bottom = this.scale.height - margin;
    const left = margin;

    // D-pad buttons
    const dirs = [
      { label: '▲', x: left + btnSize + 10, y: bottom - btnSize * 2, dir: 'up' },
      { label: '▼', x: left + btnSize + 10, y: bottom, dir: 'down' },
      { label: '◀', x: left, y: bottom - btnSize, dir: 'left' },
      { label: '▶', x: left + btnSize * 2 + 20, y: bottom - btnSize, dir: 'right' },
    ];

    for (const { label, x, y, dir } of dirs) {
      const btn = this.add.text(x, y, label, {
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 6 },
      }).setInteractive().setDepth(30);

      btn.on('pointerdown', () => emit.move(dir));
    }

    // Spray button
    const sprayBtn = this.add.text(
      this.scale.width - margin - 50,
      bottom - 30,
      '💦',
      { fontSize: '36px' }
    ).setInteractive().setDepth(30);

    sprayBtn.on('pointerdown', () => emit.spray());
  }

  update(time) {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    // Keyboard movement throttled to ~8 moves/sec
    if (time - this._lastMoveTime > 125) {
      let dir = null;
      if (this._cursors.up.isDown || this._wasd.up.isDown) dir = 'up';
      else if (this._cursors.down.isDown || this._wasd.down.isDown) dir = 'down';
      else if (this._cursors.left.isDown || this._wasd.left.isDown) dir = 'left';
      else if (this._cursors.right.isDown || this._wasd.right.isDown) dir = 'right';

      if (dir) {
        emit.move(dir);
        this._lastMoveTime = time;
      }
    }

    // Spray
    if (Phaser.Input.Keyboard.JustDown(this._spaceKey)) {
      emit.spray();
    }

    // Render sprays
    this._renderSprays(state.sprays, state.maze);
  }

  _renderSprays(sprays, maze) {
    if (!maze) return;
    const offsetX = (this.scale.width - maze.width * TILE_SIZE) / 2;
    const offsetY = 60;

    const activeIds = new Set(sprays.map((s) => s.id));

    // Remove expired spray visuals
    for (const [id, sprites] of Object.entries(this._spraySprites)) {
      if (!activeIds.has(id)) {
        sprites.forEach((s) => s?.destroy());
        delete this._spraySprites[id];
      }
    }

    for (const spray of sprays) {
      if (this._spraySprites[spray.id]) continue;
      if (!spray.tiles || spray.tiles.length === 0) continue;

      const sprites = [];
      for (const tile of spray.tiles) {
        const s = this.add.image(
          offsetX + tile.x * TILE_SIZE + TILE_SIZE / 2,
          offsetY + tile.y * TILE_SIZE + TILE_SIZE / 2,
          'water_spray'
        ).setDepth(5).setAlpha(0.8);
        sprites.push(s);
        this.tweens.add({ targets: s, alpha: 0, duration: 800, onComplete: () => s.destroy() });
      }
      this._spraySprites[spray.id] = sprites;
    }
  }

  destroy() {
    if (this._storeUnsub) this._storeUnsub();
    super.destroy();
  }
}
