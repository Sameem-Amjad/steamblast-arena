jest.mock('../src/services/questionService', () => ({
  getRandomQuestion: jest.fn(),
  recordAnswer: jest.fn(),
}));

const questionService = require('../src/services/questionService');
const GameRoom = require('../src/game/GameRoom');
const MazeGenerator = require('../src/game/MazeGenerator');
const { ROOM_STATES, SHIELD_DURATION } = require('steamblast-shared');
const { fakeIo, openMaze, QUESTION } = require('./helpers');

function playingRoom(io, players = ['a', 'b']) {
  const room = new GameRoom({ roomId: 'r1', mode: 'maths', difficulty: 1, io });
  room._persistSession = jest.fn().mockResolvedValue();
  players.forEach((id) => room.addPlayer(id, { userId: null, displayName: id, isPremium: false, avatar: {} }));
  jest.spyOn(MazeGenerator, 'generate').mockReturnValueOnce(openMaze());
  room._startGame();
  clearInterval(room._tickInterval); // tests drive the clock themselves
  return room;
}

beforeEach(() => {
  jest.useFakeTimers();
  questionService.getRandomQuestion.mockResolvedValue({ ...QUESTION, toJSON: () => QUESTION });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('starting a round', () => {
  it('counts down once everyone is ready', () => {
    const io = fakeIo();
    const room = new GameRoom({ roomId: 'r1', mode: 'maths', difficulty: 1, io });
    room.addPlayer('a', { displayName: 'A' });
    room.addPlayer('b', { displayName: 'B' });
    room.setReady('a');
    expect(room.state).toBe(ROOM_STATES.WAITING);
    room.setReady('b');
    expect(room.state).toBe(ROOM_STATES.COUNTDOWN);
    jest.advanceTimersByTime(3000);
    expect(room.state).toBe(ROOM_STATES.PLAYING);
    expect(io.events('game_start')).toHaveLength(1);
    room.close();
  });

  it('starts anyway when a player never readies up', () => {
    const io = fakeIo();
    const room = new GameRoom({ roomId: 'r1', mode: 'maths', difficulty: 1, io });
    room.addPlayer('a', { displayName: 'A' });
    room.addPlayer('b', { displayName: 'B' });
    room.startReadyGrace();
    jest.advanceTimersByTime(8000);
    expect(room.state).toBe(ROOM_STATES.COUNTDOWN);
    room.close();
  });

  it('bots are ready straight away', () => {
    const room = new GameRoom({ roomId: 'r1', mode: 'maths', difficulty: 1, io: fakeIo() });
    room.addPlayer('a', { displayName: 'A' });
    room.addPlayer('bot1', { displayName: 'Bubbles', isBot: true });
    room.setReady('a');
    expect(room.state).toBe(ROOM_STATES.COUNTDOWN);
    room.close();
  });
});

describe('the clock', () => {
  it('ticks the time out once a second, not every 5 seconds', () => {
    const io = fakeIo();
    const room = playingRoom(io);
    for (let i = 0; i < 30; i++) {
      jest.advanceTimersByTime(100);
      room._tick();
    }
    const seconds = new Set(io.events('game_tick').map((e) => Math.ceil(e.data.timeRemaining)));
    expect(seconds.size).toBeGreaterThanOrEqual(3);
    room.close();
  });
});

describe('the chamber', () => {
  async function steam(room, io) {
    room._steamPlayer('b', 'a');
    await jest.advanceTimersByTimeAsync(0);
    return io.sent.find((e) => e.target === 'b' && e.event === 'chamber_question');
  }

  it('sends the steamed player a question without the answer', async () => {
    const io = fakeIo();
    const room = playingRoom(io);
    const q = await steam(room, io);
    expect(q.data.questionText).toBe('What is 3 + 4?');
    expect(q.data.options.every((o) => !('isCorrect' in o))).toBe(true);
    expect(room.players.get('a').score).toBe(1);
    room.close();
  });

  it('respawns the player with a shield after a right answer', async () => {
    const io = fakeIo();
    const room = playingRoom(io);
    await steam(room, io);
    await room.handleChamberAnswer('b', 1);
    const b = room.players.get('b');
    expect(b.alive).toBe(true);
    expect(b.inChamber).toBe(false);
    expect(b.shieldExpiry).toBeGreaterThan(Date.now());
    expect(io.events('player_respawned')[0].data.shieldMs).toBe(SHIELD_DURATION);
    room.close();
  });

  it('takes one answer per question, so options cannot be tried in turn', async () => {
    const io = fakeIo();
    const room = playingRoom(io);
    await steam(room, io);
    await room.handleChamberAnswer('b', 0); // wrong
    await room.handleChamberAnswer('b', 1); // right, but too late
    expect(room.players.get('b').inChamber).toBe(true);
    expect(io.events('chamber_wrong')).toHaveLength(1);
    expect(io.events('chamber_correct')).toHaveLength(0);

    // A fresh question follows the wait.
    await jest.advanceTimersByTimeAsync(5000);
    expect(io.sent.filter((e) => e.event === 'chamber_question')).toHaveLength(2);
    room.close();
  });

  it('never strands a player when there are no questions', async () => {
    questionService.getRandomQuestion.mockResolvedValue(null);
    const io = fakeIo();
    const room = playingRoom(io);
    await steam(room, io);
    await jest.advanceTimersByTimeAsync(2000);
    expect(room.players.get('b').inChamber).toBe(false);
    room.close();
  });
});

describe('power-ups and movement', () => {
  it('a shield power-up really protects', () => {
    const io = fakeIo();
    const room = playingRoom(io);
    const b = room.players.get('b');
    b.x = 3; b.y = 1;
    room.powerUps = [{ x: 3, y: 1, type: 'shield', visible: true }];
    // Collect it by stepping onto it.
    b.x = 2;
    room.handleMove('b', 'right');
    expect(b.shieldExpiry).toBeGreaterThan(Date.now());

    const a = room.players.get('a');
    a.x = 1; a.y = 1;
    room.handleSpray('a');
    jest.advanceTimersByTime(900);
    room._tick();
    expect(b.alive).toBe(true);
    room.close();
  });

  it('limits how fast a player can step', () => {
    const room = playingRoom(fakeIo());
    const a = room.players.get('a');
    room.handleMove('a', 'right');
    room.handleMove('a', 'right');
    expect(a.x).toBe(2);
    jest.advanceTimersByTime(150);
    room.handleMove('a', 'right');
    expect(a.x).toBe(3);
    room.close();
  });
});

describe('leaving', () => {
  it('closes the room when the last child leaves a bot game', () => {
    const io = fakeIo();
    const room = new GameRoom({ roomId: 'r1', mode: 'maths', difficulty: 1, io });
    room._persistSession = jest.fn().mockResolvedValue();
    room.addPlayer('kid', { displayName: 'Kid' });
    room.addPlayer('bot1', { displayName: 'Bubbles', isBot: true });
    room.addPlayer('bot2', { displayName: 'Splash', isBot: true });
    room.setReady('kid');
    jest.advanceTimersByTime(3000);
    room.removePlayer('kid');
    expect(room.closed).toBe(true);
    expect(room._tickInterval).toBeNull();
  });
});

describe('a full round of bots', () => {
  it('plays two minutes without errors and reports results', async () => {
    const io = fakeIo();
    const room = new GameRoom({ roomId: 'sim', mode: 'mixed', difficulty: 2, io });
    room._persistSession = jest.fn().mockResolvedValue();
    for (const name of ['Bubbles', 'Splash', 'Drizzle', 'Puddle']) {
      room.addPlayer(`bot_${name}`, { displayName: name, isBot: true, skill: 0.6 });
    }
    room._maybeStart();
    await jest.advanceTimersByTimeAsync(3000 + 121 * 1000);

    expect(room.state).toBe(ROOM_STATES.RESULTS);
    const results = io.events('round_results');
    expect(results).toHaveLength(1);
    expect(results[0].data.results).toHaveLength(4);
    expect(io.events('player_steamed').length).toBeGreaterThan(0);
    expect(io.events('wall_broken').length).toBeGreaterThan(5);
    expect(room._persistSession).toHaveBeenCalledTimes(1);
    expect(room._timers.size).toBe(0);
  });
});
