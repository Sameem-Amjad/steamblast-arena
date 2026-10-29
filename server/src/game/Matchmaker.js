const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');
const { ROOM_STATES } = require('steamblast-shared');
const env = require('../config/env');

const MATCH_TIMEOUT = 30000; // 30s — start with what we have
const MAX_PLAYERS = 8;
const BOT_ROOM_SIZE = 4; // humans plus bots when a match is filled with bots
const FINISHED_ROOM_TTL = 2 * 60 * 1000;
const BOT_NAMES = ['Bubbles', 'Splash', 'Drizzle', 'Puddle', 'Misty', 'Nimbus', 'Squirt'];

class Matchmaker {
  constructor(io, { botFillSeconds = env.BOT_FILL_SECONDS } = {}) {
    this.io = io;
    this.rooms = new Map();
    this.queues = {};
    this.botFillMs = botFillSeconds * 1000;
    this._sweep = setInterval(() => this._cleanup(), 60 * 1000);
    this._sweep.unref?.();
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
    // "Play again" arrives from a player still sitting in the last room.
    this.removeSocket(socket.id);

    const key = this._queueKey(mode, difficulty);
    const queue = this._getOrCreateQueue(mode, difficulty);

    const entry = { socketId: socket.id, userId, displayName, isPremium, avatar, joinedAt: Date.now() };
    queue.push(entry);

    socket.emit('matchmaking_update', {
      position: queue.length,
      queueKey: key,
      botFillSeconds: this.botFillMs / 1000,
    });

    // Check if we can form a game
    this._tryMatch(mode, difficulty);
    if (!queue.includes(entry)) return;

    // Timeout — start with whoever is in queue
    entry.timeout = setTimeout(() => {
      const idx = queue.indexOf(entry);
      if (idx !== -1 && queue.length >= 2) {
        this._tryMatch(mode, difficulty, true);
      }
    }, MATCH_TIMEOUT);

    // Nobody else around: bots join so a child is never left waiting.
    if (this.botFillMs > 0) {
      entry.botTimeout = setTimeout(() => {
        if (queue.includes(entry)) this._startWithBots(mode, difficulty);
      }, this.botFillMs);
    }
  }

  leaveMatchmaking(socketId) {
    for (const key of Object.keys(this.queues)) {
      const q = this.queues[key];
      const idx = q.findIndex((e) => e.socketId === socketId);
      if (idx !== -1) {
        clearTimeout(q[idx].timeout);
        clearTimeout(q[idx].botTimeout);
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
    this._createRoom(mode, difficulty, players);
  }

  _startWithBots(mode, difficulty) {
    const queue = this._getOrCreateQueue(mode, difficulty);
    if (queue.length === 0) return;
    const humans = queue.splice(0, BOT_ROOM_SIZE);
    const bots = Math.max(1, BOT_ROOM_SIZE - humans.length);
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, bots);
    this._createRoom(mode, difficulty, humans, names);
  }

  _createRoom(mode, difficulty, players, botNames = []) {
    players.forEach((p) => {
      clearTimeout(p.timeout);
      clearTimeout(p.botTimeout);
    });

    const roomId = `room_${uuidv4().slice(0, 8)}`;
    const room = new GameRoom({ roomId, mode, difficulty, io: this.io });
    this.rooms.set(roomId, room);

    const joined = [];
    for (const p of players) {
      const socket = this.io.sockets.sockets.get(p.socketId);
      if (!socket) continue;
      socket.join(roomId);
      room.addPlayer(p.socketId, p);
      joined.push(p.socketId);
    }

    for (const name of botNames) {
      room.addPlayer(`bot_${uuidv4().slice(0, 8)}`, {
        userId: null,
        displayName: name,
        isPremium: false,
        avatar: {},
        isBot: true,
        skill: 0.45 + Math.random() * 0.3,
      });
    }

    if (joined.length === 0) {
      room.close();
      this.rooms.delete(roomId);
      return null;
    }

    this.io.to(roomId).emit('room_joined', { roomId, players: [...room.players.keys()] });
    room.startReadyGrace();
    return room;
  }

  joinPrivateRoom(socket, { roomId, mode, difficulty, userId, displayName, isPremium, avatar }) {
    this.removeSocket(socket.id);
    let room = this.rooms.get(roomId);
    if (!room || room.closed) {
      room = new GameRoom({ roomId, mode: mode || 'mixed', difficulty: difficulty || 1, io: this.io });
      this.rooms.set(roomId, room);
    }
    if (!room.addPlayer(socket.id, { userId, displayName, isPremium, avatar })) {
      socket.emit('error', { code: 'room_unavailable', message: 'That game has already started or is full.' });
      return null;
    }
    socket.join(roomId);
    socket.emit('room_joined', { roomId });
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId) {
    for (const [, room] of this.rooms) {
      if (!room.closed && room.players.has(socketId)) return room;
    }
    return null;
  }

  removeSocket(socketId) {
    this.leaveMatchmaking(socketId);
    const socket = this.io.sockets?.sockets?.get(socketId);
    for (const [, room] of this.rooms) {
      if (!room.players.has(socketId)) continue;
      room.removePlayer(socketId);
      socket?.leave(room.roomId);
    }
    this._cleanup();
  }

  // Drops rooms nobody is in any more, and finished rooms after a while.
  _cleanup() {
    const now = Date.now();
    for (const [id, r] of this.rooms) {
      const finished = r.state === ROOM_STATES.RESULTS;
      if (r.closed || (finished && (r.humanCount === 0 || now - r.endedAt > FINISHED_ROOM_TTL))) {
        r.close();
        this.rooms.delete(id);
      }
    }
  }
}

module.exports = Matchmaker;
