const MazeGenerator = require('./MazeGenerator');

const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function movePlayer(player, direction, maze) {
  const dir = DIRECTIONS[direction];
  if (!dir) return false;

  const nx = player.x + dir.dx;
  const ny = player.y + dir.dy;

  if (!MazeGenerator.isWalkable(maze.grid, nx, ny)) return false;

  player.x = nx;
  player.y = ny;
  player.direction = direction;
  return true;
}

function checkPlayerHit(player, sprays) {
  for (const spray of sprays) {
    if (spray.playerId === player.id) continue;
    if (spray.hitsTile(player.x, player.y)) return spray;
  }
  return null;
}

function checkPowerUpCollect(player, powerUps) {
  return powerUps.find((pu) => pu.x === player.x && pu.y === player.y && !pu.collected);
}

module.exports = { movePlayer, checkPlayerHit, checkPowerUpCollect };
