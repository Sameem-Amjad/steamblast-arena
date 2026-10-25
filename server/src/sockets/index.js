const Matchmaker = require('../game/Matchmaker');
const { CLIENT } = require('steamblast-shared').events;
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

function registerSocketHandlers(io) {
  const matchmaker = new Matchmaker(io);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findByPk(payload.userId);
        if (user) {
          socket.user = user;
          socket.playerData = {
            userId: user.id,
            displayName: user.displayName,
            isPremium: user.isPremium,
            avatar: { ...user.avatar, ...user.equippedItems },
          };
        }
      } catch {
        // Anonymous socket — guest players proceed without auth
      }
    }

    if (!socket.user) {
      const guestName = `Player_${Math.floor(Math.random() * 9000 + 1000)}`;
      socket.playerData = {
        userId: null,
        displayName: guestName,
        isPremium: false,
        avatar: {},
      };
    }

    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.playerData?.displayName})`);

    // ── Matchmaking ────────────────────────────────────────────────────────
    socket.on(CLIENT.JOIN_MATCHMAKING, ({ mode = 'mixed', difficulty = 1 } = {}) => {
      matchmaker.joinMatchmaking(socket, {
        mode,
        difficulty,
        ...socket.playerData,
      });
    });

    socket.on(CLIENT.LEAVE_MATCHMAKING, () => {
      matchmaker.leaveMatchmaking(socket.id);
    });

    // ── Private room ───────────────────────────────────────────────────────
    socket.on(CLIENT.JOIN_ROOM, ({ roomId, mode, difficulty } = {}) => {
      matchmaker.joinPrivateRoom(socket, { roomId, mode, difficulty, ...socket.playerData });
    });

    socket.on(CLIENT.LEAVE_ROOM, () => {
      matchmaker.removeSocket(socket.id);
    });

    // ── Ready up ──────────────────────────────────────────────────────────
    socket.on(CLIENT.READY, () => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) room.setReady(socket.id);
    });

    // ── In-game actions ────────────────────────────────────────────────────
    socket.on(CLIENT.PLAYER_MOVE, ({ direction } = {}) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) room.handleMove(socket.id, direction);
    });

    socket.on(CLIENT.PLAYER_SPRAY, () => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) room.handleSpray(socket.id);
    });

    // ── Chamber ────────────────────────────────────────────────────────────
    socket.on(CLIENT.CHAMBER_ANSWER, ({ answerIndex } = {}) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) room.handleChamberAnswer(socket.id, answerIndex);
    });

    // ── Emotes ─────────────────────────────────────────────────────────────
    socket.on(CLIENT.PLAYER_EMOTE, ({ emote } = {}) => {
      const ALLOWED_EMOTES = ['Good game!', 'Nice shot!', 'Well played!', "Let's go!", 'GG!'];
      if (!ALLOWED_EMOTES.includes(emote)) return;
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        io.to(room.roomId).emit('player_emote', { playerId: socket.id, emote });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      matchmaker.removeSocket(socket.id);
    });
  });
}

module.exports = registerSocketHandlers;
