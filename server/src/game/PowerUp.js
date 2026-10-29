const { POWERUP_TYPES, POWERUP_LIMITS, SHIELD_POWERUP_DURATION } = require('steamblast-shared');

function applyPowerUp(player, type) {
  switch (type) {
    case POWERUP_TYPES.EXTRA_WATER:
      player.waterCapacity = Math.min(player.waterCapacity + 1, POWERUP_LIMITS.waterCapacity);
      break;
    case POWERUP_TYPES.RANGE_UP:
      player.sprayRange = Math.min(player.sprayRange + 1, POWERUP_LIMITS.sprayRange);
      break;
    case POWERUP_TYPES.SPEED_BOOST:
      if ((player.speedStacks || 0) < POWERUP_LIMITS.speedStacks) {
        player.speedStacks = (player.speedStacks || 0) + 1;
        player.speed = 1.0 + player.speedStacks * 0.15;
      }
      break;
    case POWERUP_TYPES.SHIELD:
      player.hasShield = true;
      player.shieldExpiry = Date.now() + SHIELD_POWERUP_DURATION;
      break;
    case POWERUP_TYPES.SUPER_SPRAY:
      player.superSprayReady = true;
      break;
  }
  return player;
}

module.exports = { applyPowerUp };
