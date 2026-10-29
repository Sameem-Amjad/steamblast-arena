const { TILE, SPRAY_EXPAND_DELAY, SPRAY_TTL, SCORE } = require('steamblast-shared');

class WaterSpray {
  constructor({ id, playerId, x, y, range, maze }) {
    this.id = id;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.range = range;
    this.maze = maze;
    this.createdAt = Date.now();
    this.expanded = false;
    this.active = true;
    this.affectedTiles = [];
  }

  tick(now) {
    if (!this.active) return { done: true };

    if (!this.expanded && now - this.createdAt >= SPRAY_EXPAND_DELAY) {
      this.expanded = true;
      this.affectedTiles = this._expand();
      return { expanded: true, tiles: this.affectedTiles, id: this.id, playerId: this.playerId };
    }

    if (now - this.createdAt >= SPRAY_TTL) {
      this.active = false;
      return { done: true, id: this.id };
    }

    return {};
  }

  _expand() {
    const { grid } = this.maze;
    const tiles = [{ x: this.x, y: this.y }];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const { dx, dy } of directions) {
      for (let r = 1; r <= this.range; r++) {
        const tx = this.x + dx * r;
        const ty = this.y + dy * r;

        if (!grid[ty] || grid[ty][tx] === undefined) break;

        if (grid[ty][tx] === TILE.WALL) break;

        if (grid[ty][tx] === TILE.DESTRUCTIBLE) {
          tiles.push({ x: tx, y: ty, breaksWall: true });
          break;
        }

        tiles.push({ x: tx, y: ty });
      }
    }

    return tiles;
  }

  // The tiles this spray covers, before or after it bursts.
  previewTiles() {
    return this.expanded ? this.affectedTiles : this._expand();
  }

  hitsTile(tx, ty) {
    if (!this.expanded) return false;
    return this.affectedTiles.some((t) => t.x === tx && t.y === ty);
  }
}

module.exports = WaterSpray;
