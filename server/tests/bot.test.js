const Bot = require('../src/game/Bot');
const WaterSpray = require('../src/game/WaterSpray');
const { openMaze } = require('./helpers');

const { inLine, dangerTiles } = Bot;

function player(id, x, y, extra = {}) {
  return {
    socketId: id, x, y, alive: true, inChamber: false, hasShield: false, shieldExpiry: 0,
    sprayRange: 2, waterCapacity: 2, activeSprayCount: 0, reloadTime: 1500, lastSprayAt: 0, ...extra,
  };
}

function room(maze, players, sprays = []) {
  return {
    maze,
    players: new Map(players.map((p) => [p.socketId, p])),
    sprays: new Map(sprays.map((s) => [s.id, s])),
    powerUps: [],
  };
}

describe('inLine', () => {
  const { grid } = openMaze();

  it('sees along an open row within range', () => {
    expect(inLine(grid, { x: 1, y: 1 }, { x: 3, y: 1 }, 2)).toBe(true);
    expect(inLine(grid, { x: 1, y: 1 }, { x: 4, y: 1 }, 2)).toBe(false);
  });

  it('is blocked by a pillar', () => {
    // (2,2) is a pillar between (2,1) and (2,3).
    expect(inLine(grid, { x: 2, y: 1 }, { x: 2, y: 3 }, 3)).toBe(false);
  });

  it('ignores diagonals', () => {
    expect(inLine(grid, { x: 1, y: 1 }, { x: 3, y: 3 }, 5)).toBe(false);
  });
});

describe('Bot', () => {
  it('steps out of water that is about to burst', () => {
    const maze = openMaze();
    const me = player('bot', 1, 1);
    const enemy = player('kid', 9, 9);
    const spray = new WaterSpray({ id: 's1', playerId: 'kid', x: 1, y: 1, range: 2, maze });
    const r = room(maze, [me, enemy], [spray]);

    expect(dangerTiles(r, 'bot').has('1,1')).toBe(true);
    const bot = new Bot({ skill: 1, random: () => 0.5 });
    const action = bot.decide(r, me, 1000);
    expect(action.type).toBe('move');

    // The step it picks is onto open floor.
    const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[action.dir];
    expect(maze.grid[1 + step[1]][1 + step[0]]).toBe(0);
  });

  it('ignores its own sprays', () => {
    const maze = openMaze();
    const spray = new WaterSpray({ id: 's1', playerId: 'bot', x: 1, y: 1, range: 2, maze });
    const r = room(maze, [player('bot', 1, 1)], [spray]);
    expect(dangerTiles(r, 'bot').size).toBe(0);
  });

  it('sprays when an opponent is lined up', () => {
    const maze = openMaze();
    const me = player('bot', 1, 1);
    const r = room(maze, [me, player('kid', 3, 1)]);
    const bot = new Bot({ skill: 1, random: () => 0.1 });
    expect(bot.decide(r, me, 5000)).toEqual({ type: 'spray' });
  });

  it('holds fire at shielded players', () => {
    const maze = openMaze();
    const me = player('bot', 1, 1);
    const r = room(maze, [me, player('kid', 3, 1, { hasShield: true, shieldExpiry: 99999 })]);
    const bot = new Bot({ skill: 1, random: () => 0.1 });
    expect(bot.decide(r, me, 5000)).not.toEqual({ type: 'spray' });
  });

  it('thinks only a few times a second', () => {
    const maze = openMaze();
    const me = player('bot', 1, 1);
    const r = room(maze, [me, player('kid', 9, 9)]);
    const bot = new Bot({ random: () => 0.5 });
    expect(bot.decide(r, me, 1000)).not.toBeNull();
    expect(bot.decide(r, me, 1050)).toBeNull();
  });

  it('answers right or wrong but always with a real option', () => {
    const options = [{ isCorrect: false }, { isCorrect: true }, { isCorrect: false }, { isCorrect: false }];
    expect(new Bot({ random: () => 0 }).answer(options, 0.7).index).toBe(1);
    const wrong = new Bot({ random: () => 0.99 }).answer(options, 0.7);
    expect(wrong.index).not.toBe(1);
    expect(wrong.index).toBeGreaterThanOrEqual(0);
    expect(wrong.index).toBeLessThan(4);
    expect(wrong.delay).toBeGreaterThan(2000);
  });
});
