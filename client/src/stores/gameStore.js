import { create } from 'zustand';
import { POWERUP_STYLE } from '../game/powerups';

const FEED_LENGTH = 4;
let nextId = 1;

const freshRound = {
  maze: null,
  players: {},
  sprays: {},
  powerUps: {},
  effects: [],
  feed: [],
  timeRemaining: 120,
  countdown: null,
  chamberQuestion: null,
  lastAnswerResult: null,
  roundResults: null,
  error: null,
};

const nameOf = (state, id) => (id === state.mySocketId ? 'You' : state.players[id]?.displayName || 'Someone');

const withFeed = (state, text, tone = 'info') => ({
  feed: [...state.feed, { id: nextId++, text, tone, at: Date.now() }].slice(-FEED_LENGTH),
});

const patchPlayer = (state, id, patch) => (state.players[id]
  ? { players: { ...state.players, [id]: { ...state.players[id], ...patch } } }
  : {});

export const useGameStore = create((set, get) => ({
  // Match config
  mode: 'mixed',
  difficulty: 1,
  roomId: null,
  mySocketId: null,
  botFillSeconds: 0,

  // 'matchmaking' | 'countdown' | 'playing' | 'chamber' | 'results' | null
  gameState: null,
  gameId: 0,
  ...freshRound,

  // Chamber state
  chamberStreak: 0,

  // Touch controls write here; the game scene reads them every frame.
  touch: { dir: null, sprayAt: 0 },

  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setMySocketId: (mySocketId) => set({ mySocketId }),

  startMatchmaking: () => set({ ...freshRound, gameState: 'matchmaking', roomId: null }),
  setMatchmaking: ({ botFillSeconds }) => set({ botFillSeconds: botFillSeconds || 0 }),
  setRoomId: (roomId) => set({ roomId }),

  setCountdown: (count) => set({ gameState: 'countdown', countdown: count }),

  startGame: (data) => set((state) => ({
    ...freshRound,
    gameState: 'playing',
    gameId: state.gameId + 1,
    maze: data.maze,
    players: data.players,
    timeRemaining: data.timeRemaining,
    mode: data.mode || state.mode,
    difficulty: data.difficulty || state.difficulty,
    chamberStreak: 0,
  })),

  updateTick: (data) => set((state) => ({
    timeRemaining: data.timeRemaining ?? state.timeRemaining,
  })),

  updatePlayerPosition: (playerId, { x, y, direction }) => set((state) => patchPlayer(state, playerId, { x, y, direction })),

  placeSpray: ({ sprayId, playerId, x, y, tiles }) => set((state) => ({
    sprays: { ...state.sprays, [sprayId]: { id: sprayId, playerId, x, y, tiles, state: 'pending' } },
  })),

  burstSpray: (sprayId, tiles) => set((state) => (state.sprays[sprayId]
    ? { sprays: { ...state.sprays, [sprayId]: { ...state.sprays[sprayId], tiles, state: 'burst' } } }
    : {})),

  removeSpray: (sprayId) => set((state) => {
    const { [sprayId]: _gone, ...sprays } = state.sprays;
    return { sprays };
  }),

  breakWall: (x, y) => set((state) => {
    if (!state.maze) return {};
    const grid = [...state.maze.grid];
    grid[y] = [...grid[y]];
    grid[y][x] = 0; // TILE.EMPTY
    return { maze: { ...state.maze, grid } };
  }),

  showPowerUp: ({ x, y, type }) => set((state) => ({
    powerUps: { ...state.powerUps, [`${x},${y}`]: { x, y, type } },
  })),

  collectPowerUp: ({ playerId, type, x, y, stats }) => set((state) => {
    const { [`${x},${y}`]: _gone, ...powerUps } = state.powerUps;
    const label = POWERUP_STYLE[type]?.label || 'Power-up';
    const update = { powerUps };
    if (playerId === state.mySocketId) {
      Object.assign(update, patchPlayer(state, playerId, {
        ...stats,
        shieldUntil: stats?.shieldMs ? Date.now() + stats.shieldMs : state.players[playerId]?.shieldUntil,
      }));
      update.effects = [...state.effects, { id: nextId++, type: 'pickup', x, y, text: `+ ${label}` }];
      Object.assign(update, withFeed(state, `You picked up ${label}!`, 'good'));
    } else if (stats?.shieldMs) {
      Object.assign(update, patchPlayer(state, playerId, { shieldUntil: Date.now() + stats.shieldMs }));
    }
    return update;
  }),

  steamPlayer: (victimId, attackerId) => set((state) => {
    const victim = state.players[victimId];
    if (!victim) return {};
    const mine = victimId === state.mySocketId;
    const tone = mine ? 'bad' : attackerId === state.mySocketId ? 'good' : 'info';
    return {
      ...patchPlayer(state, victimId, { alive: false, inChamber: true }),
      effects: [...state.effects.slice(-20), { id: nextId++, type: 'steam', x: victim.x, y: victim.y, mine }],
      ...withFeed(state, `${nameOf(state, attackerId)} steamed ${mine ? 'you' : victim.displayName}!`, tone),
    };
  }),

  respawnPlayer: (playerId, { x, y, shieldMs }) => set((state) => patchPlayer(state, playerId, {
    x, y, alive: true, inChamber: false, shieldUntil: shieldMs ? Date.now() + shieldMs : 0,
  })),

  updateScore: (playerId, score) => set((state) => patchPlayer(state, playerId, { score })),

  removePlayer: (playerId) => set((state) => {
    if (!state.players[playerId]) return {};
    const { [playerId]: gone, ...players } = state.players;
    return { players, ...withFeed(state, `${gone.displayName} left the game`) };
  }),

  showEmote: (playerId, emote) => set((state) => withFeed(state, `${nameOf(state, playerId)}: “${emote}”`)),

  enterChamber: (question) => set({
    gameState: 'chamber',
    chamberQuestion: question,
    lastAnswerResult: null,
  }),

  answerResult: (result) => set((state) => ({
    lastAnswerResult: result,
    chamberStreak: result.correct ? result.streak ?? state.chamberStreak + 1 : 0,
  })),

  exitChamber: () => set((state) => (state.gameState === 'chamber'
    ? { gameState: 'playing', chamberQuestion: null }
    : {})),

  showResults: (results) => set({ gameState: 'results', roundResults: results, chamberQuestion: null }),

  setError: (error) => set({ error }),

  setTouchDir: (dir) => set((state) => ({ touch: { ...state.touch, dir } })),
  pressSpray: () => set((state) => ({ touch: { ...state.touch, sprayAt: Date.now() } })),

  reset: () => set({ ...freshRound, gameState: null, roomId: null, touch: { dir: null, sprayAt: 0 } }),
}));

// Read-only handle for automated checks and the demo recorder.
if (typeof window !== 'undefined') {
  window.steamblast = { getState: () => useGameStore.getState() };
}
