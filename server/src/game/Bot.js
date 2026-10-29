const { TILE } = require('steamblast-shared');

// Fills a match when there aren't enough children online. A bot dodges water that is about to
// burst, takes a shot when someone is lined up, digs through crates for power-ups and otherwise
// walks towards the nearest power-up or firing position. It thinks a few times a second, slower
// than a child can press keys, so it can be beaten.

const DIRS = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 },
];

const key = (x, y) => `${x},${y}`;

const isEmpty = (grid, x, y) => grid[y]?.[x] === TILE.EMPTY;

// Tiles that other players' unburst sprays will soak.
function dangerTiles(room, selfId) {
  const danger = new Set();
  for (const spray of room.sprays.values()) {
    if (spray.expanded || spray.playerId === selfId) continue;
    for (const t of spray.previewTiles()) danger.add(key(t.x, t.y));
  }
  return danger;
}

// Whether a spray from `from` would reach `to`: same row or column, in range, nothing solid between.
function inLine(grid, from, to, range) {
  if (from.x !== to.x && from.y !== to.y) return false;
  const dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  if (dist === 0 || dist > range) return false;
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  for (let i = 1; i < dist; i++) {
    if (!isEmpty(grid, from.x + dx * i, from.y + dy * i)) return false;
  }
  return true;
}

function nextToCrate(grid, p) {
  return DIRS.some(({ dx, dy }) => grid[p.y + dy]?.[p.x + dx] === TILE.DESTRUCTIBLE);
}

// Breadth-first search over walkable tiles. Returns, for every reachable tile, its distance and
// the first step to take towards it.
function explore(grid, start, avoid) {
  const seen = new Map([[key(start.x, start.y), { dist: 0, first: null, x: start.x, y: start.y }]]);
  const queue = [seen.get(key(start.x, start.y))];
  while (queue.length) {
    const cur = queue.shift();
    for (const { dir, dx, dy } of DIRS) {
      const x = cur.x + dx;
      const y = cur.y + dy;
      const k = key(x, y);
      if (seen.has(k) || !isEmpty(grid, x, y) || avoid.has(k)) continue;
      const node = { dist: cur.dist + 1, first: cur.first || dir, x, y };
      seen.set(k, node);
      queue.push(node);
    }
  }
  return seen;
}

class Bot {
  constructor({ skill = 0.6, random = Math.random } = {}) {
    this.skill = skill; // 0..1: how quickly it reacts and how often it takes a good shot
    this.random = random;
    this.nextActAt = 0;
  }

  decide(room, me, now) {
    if (now < this.nextActAt) return null;
    this.nextActAt = now + 200 + this.random() * (450 - 250 * this.skill);

    const { grid } = room.maze;
    const danger = dangerTiles(room, me.socketId);

    // 1. Get out of the way of water that's about to burst.
    if (danger.has(key(me.x, me.y))) {
      const reachable = explore(grid, me, new Set());
      let best = null;
      for (const node of reachable.values()) {
        if (node.dist > 0 && !danger.has(key(node.x, node.y)) && (!best || node.dist < best.dist)) best = node;
      }
      return best ? { type: 'move', dir: best.first } : null;
    }

    const canSpray = now - me.lastSprayAt >= me.reloadTime && me.activeSprayCount < me.waterCapacity;
    const targets = [...room.players.values()].filter((p) => p.socketId !== me.socketId
      && p.alive && !p.inChamber && !(p.hasShield && now < p.shieldExpiry));

    // 2. Take the shot when someone is lined up.
    if (canSpray && targets.some((t) => inLine(grid, me, t, me.sprayRange))
      && this.random() < 0.35 + 0.5 * this.skill) {
      return { type: 'spray' };
    }

    // 3. Dig through crates now and then: they hide power-ups.
    if (canSpray && nextToCrate(grid, me) && this.random() < 0.3) return { type: 'spray' };

    // 4. Walk towards a power-up, a firing position or a crate, never into danger.
    const reachable = explore(grid, me, danger);
    const powerUps = new Set(room.powerUps.filter((p) => p.visible && !p.collected).map((p) => key(p.x, p.y)));
    let best = null;
    for (const node of reachable.values()) {
      if (node.dist === 0) continue;
      let cost = null;
      if (powerUps.has(key(node.x, node.y))) cost = node.dist;
      else if (targets.some((t) => inLine(grid, node, t, me.sprayRange))) cost = node.dist + 2;
      else if (nextToCrate(grid, node)) cost = node.dist + 6;
      if (cost !== null && (!best || cost < best.cost)) best = { ...node, cost };
    }

    if (best && this.random() > 0.15) return { type: 'move', dir: best.first };

    const steps = DIRS.filter(({ dx, dy }) => isEmpty(grid, me.x + dx, me.y + dy) && !danger.has(key(me.x + dx, me.y + dy)));
    if (!steps.length) return null;
    return { type: 'move', dir: steps[Math.floor(this.random() * steps.length)].dir };
  }

  // Picks an answer in the chamber: right most of the time, quicker when the bot is sharper.
  answer(options, accuracy) {
    const correct = options.findIndex((o) => o.isCorrect);
    const delay = 2500 + this.random() * (5000 - 2000 * this.skill);
    if (this.random() < accuracy || options.length < 2) return { index: correct, delay };
    const wrong = (correct + 1 + Math.floor(this.random() * (options.length - 1))) % options.length;
    return { index: wrong, delay };
  }
}

module.exports = Bot;
module.exports.inLine = inLine;
module.exports.dangerTiles = dangerTiles;
