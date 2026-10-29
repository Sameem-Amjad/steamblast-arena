jest.mock('../src/services/questionService', () => ({
  getRandomQuestion: jest.fn().mockResolvedValue(null),
  recordAnswer: jest.fn(),
}));

const Matchmaker = require('../src/game/Matchmaker');
const { ROOM_STATES } = require('steamblast-shared');
const { fakeIo } = require('./helpers');

const kid = (name) => ({ mode: 'maths', difficulty: 1, userId: null, displayName: name, isPremium: false, avatar: {} });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('Matchmaker', () => {
  it('fills a lone player\'s match with bots', () => {
    const io = fakeIo();
    const mm = new Matchmaker(io, { botFillSeconds: 3 });
    const socket = io.addSocket('s1');
    mm.joinMatchmaking(socket, kid('Mia'));
    expect(mm.rooms.size).toBe(0);

    jest.advanceTimersByTime(3000);
    const room = mm.getRoomBySocketId('s1');
    expect(room).toBeTruthy();
    expect(room.playerCount).toBe(4);
    expect(room.humanCount).toBe(1);
    expect(io.events('room_joined')).toHaveLength(1);
    room.close();
  });

  it('waits for real players when bots are off', () => {
    const io = fakeIo();
    const mm = new Matchmaker(io, { botFillSeconds: 0 });
    mm.joinMatchmaking(io.addSocket('s1'), kid('Mia'));
    jest.advanceTimersByTime(10000);
    expect(mm.rooms.size).toBe(0);
    mm.joinMatchmaking(io.addSocket('s2'), kid('Leo'));
    jest.advanceTimersByTime(30000);
    expect(mm.getRoomBySocketId('s1')).toBe(mm.getRoomBySocketId('s2'));
    mm.getRoomBySocketId('s1').close();
  });

  it('puts two waiting children in the same bot game', () => {
    const io = fakeIo();
    const mm = new Matchmaker(io, { botFillSeconds: 3 });
    mm.joinMatchmaking(io.addSocket('s1'), kid('Mia'));
    jest.advanceTimersByTime(1000);
    mm.joinMatchmaking(io.addSocket('s2'), kid('Leo'));
    jest.advanceTimersByTime(2000);
    const room = mm.getRoomBySocketId('s1');
    expect(room.humanCount).toBe(2);
    expect(room).toBe(mm.getRoomBySocketId('s2'));
    room.close();
  });

  it('"play again" moves the player out of the finished room', () => {
    const io = fakeIo();
    const mm = new Matchmaker(io, { botFillSeconds: 3 });
    const socket = io.addSocket('s1');
    mm.joinMatchmaking(socket, kid('Mia'));
    jest.advanceTimersByTime(3000);
    const first = mm.getRoomBySocketId('s1');
    first._persistSession = jest.fn().mockResolvedValue();
    first.setReady('s1');
    jest.advanceTimersByTime(3000);
    first._endGame();
    expect(first.state).toBe(ROOM_STATES.RESULTS);

    mm.joinMatchmaking(socket, kid('Mia'));
    expect(first.players.has('s1')).toBe(false);
    expect(socket.rooms.has(first.roomId)).toBe(false);
    expect(mm.rooms.has(first.roomId)).toBe(false);

    jest.advanceTimersByTime(3000);
    const second = mm.getRoomBySocketId('s1');
    expect(second).not.toBe(first);
    second.close();
  });

  it('cancelling stops the bots from starting a game', () => {
    const io = fakeIo();
    const mm = new Matchmaker(io, { botFillSeconds: 3 });
    mm.joinMatchmaking(io.addSocket('s1'), kid('Mia'));
    mm.leaveMatchmaking('s1');
    jest.advanceTimersByTime(5000);
    expect(mm.rooms.size).toBe(0);
  });
});
