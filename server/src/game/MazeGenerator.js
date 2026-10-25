const { TILE, MAZE_SIZES, PLAYER_SPAWN_CORNERS, POWERUP_TYPES } = require('steamblast-shared');

class MazeGenerator {
  static generate(playerCount) {
    const size = playerCount <= 4 ? MAZE_SIZES.SMALL : MAZE_SIZES.LARGE;
    const { width, height } = size;

    const grid = this._initGrid(width, height);
    this._carvePassages(grid, width, height);
    const powerUps = this._placePowerUps(grid, width, height);
    const spawnPoints = this._getSpawnPoints(playerCount, size);

    // Clear spawn corners
    for (const sp of spawnPoints) {
      this._clearCorner(grid, sp.x, sp.y);
    }

    return { width, height, grid, powerUps, spawnPoints };
  }

  static _initGrid(width, height) {
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          grid[y][x] = TILE.WALL;
        } else if (x % 2 === 0 && y % 2 === 0) {
          grid[y][x] = TILE.WALL;
        } else {
          grid[y][x] = TILE.DESTRUCTIBLE;
        }
      }
    }
    return grid;
  }

  static _carvePassages(grid, width, height) {
    // Random open corridors — roughly 40% of destructible walls become empty
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === TILE.DESTRUCTIBLE && Math.random() < 0.4) {
          grid[y][x] = TILE.EMPTY;
        }
      }
    }
  }

  static _placePowerUps(grid, width, height) {
    const types = Object.values(POWERUP_TYPES);
    const powerUps = [];
    let placed = 0;
    const target = Math.floor((width * height) * 0.03);

    for (let y = 1; y < height - 1 && placed < target; y++) {
      for (let x = 1; x < width - 1 && placed < target; x++) {
        if (grid[y][x] === TILE.DESTRUCTIBLE && Math.random() < 0.15) {
          const type = types[Math.floor(Math.random() * types.length)];
          powerUps.push({ x, y, type, visible: false });
          placed++;
        }
      }
    }
    return powerUps;
  }

  static _getSpawnPoints(playerCount, size) {
    const spawns = PLAYER_SPAWN_CORNERS.slice(0, playerCount);
    // Adjust for small vs large maze
    if (size === MAZE_SIZES.SMALL) {
      return spawns.map((sp) => ({
        x: Math.min(sp.x, size.width - 2),
        y: Math.min(sp.y, size.height - 2),
      }));
    }
    return spawns;
  }

  static _clearCorner(grid, cx, cy) {
    const safe = [
      { x: cx, y: cy },
      { x: cx + 1, y: cy },
      { x: cx, y: cy + 1 },
    ];
    for (const pos of safe) {
      if (grid[pos.y] && grid[pos.y][pos.x] !== undefined) {
        if (grid[pos.y][pos.x] !== TILE.WALL) {
          grid[pos.y][pos.x] = TILE.EMPTY;
        }
      }
    }
  }

  static isSolid(grid, x, y) {
    if (!grid[y] || grid[y][x] === undefined) return true;
    return grid[y][x] === TILE.WALL || grid[y][x] === TILE.DESTRUCTIBLE;
  }

  static isWalkable(grid, x, y) {
    if (!grid[y] || grid[y][x] === undefined) return false;
    return grid[y][x] === TILE.EMPTY;
  }
}

module.exports = MazeGenerator;
