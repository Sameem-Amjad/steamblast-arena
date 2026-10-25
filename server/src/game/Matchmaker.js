const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');
const { ROOM_STATES } = require('steamblast-shared');

const MATCH_TIMEOUT = 30000; // 30s — start with what we have
const MAX_PLAYERS = 8;

class Matchmaker {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.queues = {};
  }

  _queueKey(mode, difficulty) {
    return `${mode}_${difficulty}`;
  }

  _getOrCreateQueue(mode, difficulty) {
    const key = this._queueKey(mode, difficulty);
    if (!this.queues[key]) this.queues[key] = [];
    return this.queues[key];
  }

  joinMatchmaking(socket, { mode, difficulty, userId, displayName, isPremium, avatar }) {
    const key = this._queueKey(mode, difficulty);
    const queue = this._getOrCreateQueue(mode, difficulty);

    // Prevent duplicates
    if (queue.find((e) => e.socketId === socket.id)) return;

    const entry = { socketId: socket.id, userId, displayName, isPremium, avatar, joinedAt: Date.now() };
    queue.push(entry);

    socket.emit('matchmaking_update', { position: queue.length, queueKey: key });

    // Check if we can form a game
    this._tryMatch(mode, difficulty);

    // Timeout — start with whoever is in queue
    entry.timeout = setTimeout(() => {
      const idx = queue.indexOf(entry);
      if (idx !== -1 && queue.length >= 2) {
        this._tryMatch(mode, difficulty, true);
      }
    }, MATCH_TIMEOUT);
  }

  leaveMatchmaking(socketId) {
    for (const key of Object.keys(this.queues)) {
      const q = this.queues[key];
      const idx = q.findIndex((e) => e.socketId === socketId);
      if (idx !== -1) {
        clearTimeout(q[idx].timeout);
        q.splice(idx, 1);
        return;
      }
    }
  }

  _tryMatch(mode, difficulty, force = false) {
    const queue = this._getOrCreateQueue(mode, difficulty);
    const minPlayers = force ? 2 : 4;
    if (queue.length < minPlayers && queue.length < MAX_PLAYERS && !force) return;
    if (queue.length < 2) return;

    const players = queue.splice(0, Math.min(queue.length, MAX_PLAYERS));
    players.forEach((p) => clearTimeout(p.timeout));

    const roomId = `room_${uuidv4().slice(0, 8)}`;
    const room = new GameRoom({ roomId, mode, difficulty, io: this.io });
    this.rooms.set(roomId, room);

    for (const p of players) {
      const socket = this.io.sockets.sockets.get(p.socketId);
      if (!socket) continue;
      socket.join(roomId);
      room.addPlayer(p.socketId, p);
    }

    this.io.to(roomId).emit('room_joined', { roomId, players: players.map((p) => p.socketId) });
  }

  joinPrivateRoom(socket, { roomId, mode, difficulty, userId, displayName, isPremium, avatar }) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new GameRoom({ roomId, mode: mode || 'mixed', difficulty: difficulty || 1, io: this.io });
      this.rooms.set(roomId, room);
    }
    socket.join(roomId);
    room.addPlayer(socket.id, { userId, displayName, isPremium, avatar });
    socket.emit('room_joined', { roomId });
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId) {
    for (const [, room] of this.rooms) {
      if (room.players.has(socketId)) return room;
    }
    return null;
  }

  removeSocket(socketId) {
    this.leaveMatchmaking(socketId);
    const room = this.getRoomBySocketId(socketId);
    if (room) room.removePlayer(socketId);
    // Clean up empty finished rooms
    for (const [id, r] of this.rooms) {
      if (r.playerCount === 0 && r.state === ROOM_STATES.RESULTS) {
        this.rooms.delete(id);
      }
    }
  }
}

module.exports = Matchmaker;
