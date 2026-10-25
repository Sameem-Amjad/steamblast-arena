import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Match config
  mode: 'mixed',
  difficulty: 1,
  roomId: null,

  // Game state
  gameState: null,  // 'matchmaking' | 'countdown' | 'playing' | 'chamber' | 'results'
  maze: null,
  players: {},
  sprays: [],
  timeRemaining: 120,
  countdown: null,

  // Chamber state
  chamberQuestion: null,
  chamberTimeLeft: 15,
  chamberStreak: 0,
  lastAnswerResult: null,

  // Results
  roundResults: null,

  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),

  startMatchmaking: () => set({ gameState: 'matchmaking', roomId: null, roundResults: null }),
  setRoomId: (roomId) => set({ roomId }),

  setCountdown: (count) => set({ gameState: 'countdown', countdown: count }),

  startGame: (data) => set({
    gameState: 'playing',
    maze: data.maze,
    players: data.players,
    timeRemaining: data.timeRemaining,
    sprays: [],
  }),

  updateTick: (data) => set((state) => ({
    timeRemaining: data.timeRemaining ?? state.timeRemaining,
  })),

  updatePlayerPosition: (playerId, { x, y, direction }) => set((state) => ({
    players: {
      ...state.players,
      [playerId]: { ...state.players[playerId], x, y, direction },
    },
  })),

  addSpray: (spray) => set((state) => ({
    sprays: [...state.sprays, spray],
  })),

  removeSpray: (sprayId) => set((state) => ({
    sprays: state.sprays.filter((s) => s.id !== sprayId),
  })),

  breakWall: (x, y) => set((state) => {
    if (!state.maze) return {};
    const grid = state.maze.grid.map((row) => [...row]);
    grid[y][x] = 0; // TILE.EMPTY
    return { maze: { ...state.maze, grid } };
  }),

  steamPlayer: (victimId) => set((state) => ({
    players: {
      ...state.players,
      [victimId]: { ...state.players[victimId], alive: false, inChamber: true },
    },
  })),

  respawnPlayer: (playerId, { x, y }) => set((state) => ({
    players: {
      ...state.players,
      [playerId]: { ...state.players[playerId], x, y, alive: true, inChamber: false },
    },
  })),

  updateScore: (playerId, score) => set((state) => ({
    players: {
      ...state.players,
      [playerId]: { ...state.players[playerId], score },
    },
  })),

  enterChamber: (question) => set({
    gameState: 'chamber',
    chamberQuestion: question,
    chamberTimeLeft: 15,
    lastAnswerResult: null,
  }),

  setChamberTimeLeft: (t) => set({ chamberTimeLeft: t }),

  answerResult: (result) => set({ lastAnswerResult: result }),

  exitChamber: () => set({ gameState: 'playing', chamberQuestion: null }),

  showResults: (results) => set({ gameState: 'results', roundResults: results }),

  reset: () => set({
    gameState: null,
    maze: null,
    players: {},
    sprays: [],
    timeRemaining: 120,
    chamberQuestion: null,
    roundResults: null,
    roomId: null,
  }),
}));
