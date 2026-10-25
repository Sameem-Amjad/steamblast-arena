import { getSocket } from './socket';
import { useGameStore } from '../stores/gameStore';

// Maps all server events to Zustand store updates
export function attachGameListeners() {
  const socket = getSocket();
  if (!socket) return;

  const store = useGameStore.getState;

  socket.on('room_joined', ({ roomId }) => {
    store().setRoomId(roomId);
  });

  socket.on('countdown_start', ({ count }) => {
    store().setCountdown(count);
  });

  socket.on('game_start', (data) => {
    store().startGame(data);
  });

  socket.on('game_tick', (data) => {
    store().updateTick(data);
    if (data.sprayEvents) {
      for (const ev of data.sprayEvents) {
        if (ev.type === 'expanded') {
          store().addSpray({ id: ev.sprayId, playerId: ev.playerId, tiles: ev.tiles });
          // Remove spray after visual TTL
          setTimeout(() => store().removeSpray(ev.sprayId), 800);
        }
      }
    }
  });

  socket.on('player_moved', ({ playerId, x, y, direction }) => {
    store().updatePlayerPosition(playerId, { x, y, direction });
  });

  socket.on('spray_placed', (spray) => {
    // Visual placeholder before expansion
    store().addSpray({ ...spray, tiles: [] });
  });

  socket.on('wall_broken', ({ x, y }) => {
    store().breakWall(x, y);
  });

  socket.on('player_steamed', ({ victimId }) => {
    store().steamPlayer(victimId);
  });

  socket.on('player_respawned', ({ playerId, x, y, shield, speedBoost }) => {
    store().respawnPlayer(playerId, { x, y });
  });

  socket.on('score_update', ({ playerId, score }) => {
    store().updateScore(playerId, score);
  });

  socket.on('powerup_collected', ({ playerId, type }) => {
    // Handled in GameScene for visual effect
  });

  socket.on('chamber_question', (question) => {
    store().enterChamber(question);
  });

  socket.on('chamber_correct', (result) => {
    store().answerResult({ correct: true, ...result });
    setTimeout(() => store().exitChamber(), 1500);
  });

  socket.on('chamber_wrong', (result) => {
    store().answerResult({ correct: false, ...result });
  });

  socket.on('chamber_timeout', () => {
    store().answerResult({ correct: false, timeout: true });
  });

  socket.on('round_results', ({ results }) => {
    store().showResults(results);
  });
}

export function detachGameListeners() {
  const socket = getSocket();
  if (!socket) return;
  const events = [
    'room_joined','countdown_start','game_start','game_tick','player_moved',
    'spray_placed','wall_broken','player_steamed','player_respawned','score_update',
    'powerup_collected','chamber_question','chamber_correct','chamber_wrong',
    'chamber_timeout','round_results',
  ];
  for (const ev of events) socket.off(ev);
}

// Emit helpers
export const emit = {
  joinMatchmaking: (mode, difficulty) => getSocket()?.emit('join_matchmaking', { mode, difficulty }),
  leaveMatchmaking: () => getSocket()?.emit('leave_matchmaking'),
  joinRoom: (roomId, mode, difficulty) => getSocket()?.emit('join_room', { roomId, mode, difficulty }),
  ready: () => getSocket()?.emit('ready'),
  move: (direction) => getSocket()?.emit('player_move', { direction }),
  spray: () => getSocket()?.emit('player_spray'),
  answer: (answerIndex) => getSocket()?.emit('chamber_answer', { answerIndex }),
  emote: (emote) => getSocket()?.emit('player_emote', { emote }),
};
