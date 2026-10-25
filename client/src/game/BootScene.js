import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Procedurally generate placeholder textures since real assets aren't available yet
    this._createPlaceholderGraphics();
  }

  _createPlaceholderGraphics() {
    // Wall tile
    const wallGfx = this.make.graphics({ x: 0, y: 0, add: false });
    wallGfx.fillStyle(0x2c3e50);
    wallGfx.fillRect(0, 0, 48, 48);
    wallGfx.lineStyle(2, 0x1a252f);
    wallGfx.strokeRect(0, 0, 48, 48);
    wallGfx.generateTexture('tile_wall', 48, 48);
    wallGfx.destroy();

    // Destructible wall
    const destGfx = this.make.graphics({ x: 0, y: 0, add: false });
    destGfx.fillStyle(0x8e6b3e);
    destGfx.fillRect(0, 0, 48, 48);
    destGfx.lineStyle(2, 0x6b4f2d);
    destGfx.strokeRect(2, 2, 44, 44);
    destGfx.generateTexture('tile_destructible', 48, 48);
    destGfx.destroy();

    // Empty tile
    const emptyGfx = this.make.graphics({ x: 0, y: 0, add: false });
    emptyGfx.fillStyle(0x1e3a2f);
    emptyGfx.fillRect(0, 0, 48, 48);
    emptyGfx.generateTexture('tile_empty', 48, 48);
    emptyGfx.destroy();

    // Player body (circle)
    const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
    playerGfx.fillStyle(0xffffff);
    playerGfx.fillCircle(20, 20, 18);
    playerGfx.fillStyle(0x000000);
    playerGfx.fillCircle(13, 16, 3);
    playerGfx.fillCircle(27, 16, 3);
    playerGfx.fillStyle(0xff0000);
    playerGfx.fillRect(12, 24, 16, 4);
    playerGfx.generateTexture('player', 40, 40);
    playerGfx.destroy();

    // Water spray tile
    const waterGfx = this.make.graphics({ x: 0, y: 0, add: false });
    waterGfx.fillStyle(0x4A90D9, 0.7);
    waterGfx.fillRect(0, 0, 48, 48);
    waterGfx.generateTexture('water_spray', 48, 48);
    waterGfx.destroy();

    // Powerup icons
    const POWERUP_COLORS = {
      extra_water: 0x3498db,
      range_up: 0xe74c3c,
      speed_boost: 0x2ecc71,
      shield: 0xf1c40f,
      super_spray: 0x9b59b6,
    };
    for (const [key, color] of Object.entries(POWERUP_COLORS)) {
      const puGfx = this.make.graphics({ x: 0, y: 0, add: false });
      puGfx.fillStyle(color);
      puGfx.fillCircle(16, 16, 14);
      puGfx.generateTexture(`pu_${key}`, 32, 32);
      puGfx.destroy();
    }
  }

  create() {
    this.scene.start('GameScene');
  }
}
