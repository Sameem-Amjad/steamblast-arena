import { getSocket } from './socket';
import { useGameStore } from '../stores/gameStore';

const EVENTS = [
  'connect', 'matchmaking_update', 'room_joined', 'player_left', 'countdown_start', 'game_start',
  'game_tick', 'player_moved', 'spray_placed', 'wall_broken', 'powerup_spawned', 'powerup_collected',
  'player_steamed', 'player_respawned', 'score_update', 'player_emote', 'chamber_question',
  'chamber_correct', 'chamber_wrong', 'chamber_timeout', 'round_results', 'error',
];

let attachedTo = null;

// Maps all server events to Zustand store updates. Safe to call more than once per socket.
export function attachGameListeners() {
  const socket = getSocket();
  if (!socket || attachedTo === socket) return;
  attachedTo = socket;

  const store = useGameStore.getState;
  if (socket.connected) store().setMySocketId(socket.id);

  socket.on('connect', () => store().setMySocketId(socket.id));

  socket.on('matchmaking_update', (data) => store().setMatchmaking(data));

  socket.on('room_joined', ({ roomId }) => {
    store().setRoomId(roomId);
    socket.emit('ready');
  });

  socket.on('player_left', ({ playerId }) => store().removePlayer(playerId));

  socket.on('countdown_start', ({ count }) => store().setCountdown(count));

  socket.on('game_start', (data) => store().startGame(data));

  socket.on('game_tick', (data) => {
    store().updateTick(data);
    for (const ev of data.sprayEvents || []) {
      if (ev.type === 'expanded') store().burstSpray(ev.sprayId, ev.tiles);
      if (ev.type === 'expired') store().removeSpray(ev.sprayId);
    }
  });

  socket.on('player_moved', ({ playerId, x, y, direction }) => {
    store().updatePlayerPosition(playerId, { x, y, direction });
  });

  socket.on('spray_placed', (spray) => store().placeSpray(spray));

  socket.on('wall_broken', ({ x, y }) => store().breakWall(x, y));

  socket.on('powerup_spawned', (pu) => store().showPowerUp(pu));

  socket.on('powerup_collected', (data) => store().collectPowerUp(data));

  socket.on('player_steamed', ({ victimId, attackerId }) => store().steamPlayer(victimId, attackerId));

  socket.on('player_respawned', ({ playerId, x, y, shieldMs }) => {
    store().respawnPlayer(playerId, { x, y, shieldMs });
  });

  socket.on('score_update', ({ playerId, score }) => store().updateScore(playerId, score));

  socket.on('player_emote', ({ playerId, emote }) => store().showEmote(playerId, emote));

  socket.on('chamber_question', (question) => store().enterChamber(question));

  socket.on('chamber_correct', (result) => {
    store().answerResult({ correct: true, ...result });
    setTimeout(() => store().exitChamber(), 1500);
  });

  socket.on('chamber_wrong', (result) => store().answerResult({ correct: false, ...result }));

  socket.on('chamber_timeout', () => store().answerResult({ correct: false, timeout: true }));

  socket.on('round_results', ({ results }) => store().showResults(results));

  socket.on('error', (err) => store().setError(err));
}

export function detachGameListeners() {
  const socket = getSocket();
  if (!socket) return;
  for (const ev of EVENTS) socket.off(ev);
  attachedTo = null;
}

// Emit helpers
export const emit = {
  joinMatchmaking: (mode, difficulty) => getSocket()?.emit('join_matchmaking', { mode, difficulty }),
  leaveMatchmaking: () => getSocket()?.emit('leave_matchmaking'),
  joinRoom: (roomId, mode, difficulty) => getSocket()?.emit('join_room', { roomId, mode, difficulty }),
  leaveRoom: () => getSocket()?.emit('leave_room'),
  ready: () => getSocket()?.emit('ready'),
  move: (direction) => getSocket()?.emit('player_move', { direction }),
  spray: () => getSocket()?.emit('player_spray'),
  answer: (answerIndex) => getSocket()?.emit('chamber_answer', { answerIndex }),
  emote: (emote) => getSocket()?.emit('player_emote', { emote }),
};
