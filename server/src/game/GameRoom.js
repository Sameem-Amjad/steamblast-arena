const { v4: uuidv4 } = require('uuid');
const {
  PLAYER_DEFAULTS, ROUND_DURATION, CHAMBER_TIMEOUT, CHAMBER_WRONG_PENALTY,
  FAST_ANSWER_THRESHOLD, SCORE, SHIELD_DURATION, SPEED_BONUS_DURATION,
  MOVE_INTERVAL, TILE, ROOM_STATES, AVATAR_DEFAULTS,
} = require('steamblast-shared');
const { SERVER } = require('steamblast-shared').events;
const MazeGenerator = require('./MazeGenerator');
const WaterSpray = require('./WaterSpray');
const Bot = require('./Bot');
const { movePlayer, checkPowerUpCollect } = require('./Physics');
const { applyPowerUp } = require('./PowerUp');
const questionService = require('../services/questionService');
const env = require('../config/env');

const TICK_RATE = 100; // ms
const MAX_PLAYERS = 8;
const READY_GRACE = 8000; // ms: start anyway if a player never sends "ready"
const BOT_ACCURACY = { 1: 0.8, 2: 0.7, 3: 0.6 };

class GameRoom {
  constructor({ roomId, mode, difficulty, classRoomId, io }) {
    this.roomId = roomId;
    this.mode = mode;
    this.difficulty = difficulty;
    this.classRoomId = classRoomId || null;
    this.io = io;
    this.state = ROOM_STATES.WAITING;
    this.closed = false;

    this.players = new Map();
    this.sprays = new Map();
    this.maze = null;
    this.powerUps = [];
    this.roundSeconds = env.ROUND_SECONDS || ROUND_DURATION;
    this.timeRemaining = this.roundSeconds;

    this._tickInterval = null;
    this._countdownInterval = null;
    this._timers = new Set();
    this._nextColor = 0;
    this._lastSecond = null;
    this._startedAt = null;
    this.endedAt = null;
  }

  get playerCount() { return this.players.size; }

  get humanCount() {
    let n = 0;
    for (const p of this.players.values()) if (!p.isBot) n++;
    return n;
  }

  addPlayer(socketId, playerData) {
    if (this.state !== ROOM_STATES.WAITING || this.players.size >= MAX_PLAYERS) return false;
    const defaults = playerData.isPremium ? PLAYER_DEFAULTS.PREMIUM : PLAYER_DEFAULTS.FREE;
    this.players.set(socketId, {
      socketId,
      userId: playerData.userId,
      displayName: playerData.displayName,
      isPremium: playerData.isPremium,
      avatar: playerData.avatar,
      isBot: Boolean(playerData.isBot),
      bot: playerData.isBot ? new Bot({ skill: playerData.skill }) : null,
      colorIndex: this._nextColor++ % AVATAR_DEFAULTS.length,
      x: 0, y: 0,
      direction: 'down',
      waterCapacity: defaults.waterCapacity,
      sprayRange: defaults.sprayRange,
      speed: defaults.speed,
      reloadTime: defaults.reloadTime,
      activeSprayCount: 0,
      score: 0,
      alive: true,
      hasShield: false,
      shieldExpiry: 0,
      superSprayReady: false,
      speedStacks: 0,
      inChamber: false,
      chamberQuestion: null,
      chamberTimeout: null,
      recentQuestions: [],
      answerStreak: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      answerTimes: [],
      steamCount: 0,
      steamed: 0,
      lastSprayAt: 0,
      lastMoveAt: 0,
      ready: Boolean(playerData.isBot),
    });
    this._emit(SERVER.PLAYER_JOINED, { playerId: socketId, player: this._publicPlayer(socketId) });
    return true;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return;
    this._clearTimer(player.chamberTimeout);
    this.players.delete(socketId);
    this._emit(SERVER.PLAYER_LEFT, { playerId: socketId });

    if (this.humanCount === 0) {
      this.close();
    } else if (this.state === ROOM_STATES.PLAYING && this.players.size < 2) {
      this._endGame();
    } else if (this.state === ROOM_STATES.WAITING) {
      this._maybeStart();
    }
  }

  setReady(socketId) {
    const p = this.players.get(socketId);
    if (!p) return;
    p.ready = true;
    this._maybeStart();
  }

  // Called once the room is formed: nobody waits forever for a player who never readies up.
  startReadyGrace() {
    this._later(() => {
      if (this.state !== ROOM_STATES.WAITING) return;
      for (const p of this.players.values()) p.ready = true;
      this._maybeStart();
    }, READY_GRACE);
  }

  _maybeStart() {
    if (this.state !== ROOM_STATES.WAITING || this.players.size < 2) return;
    if (![...this.players.values()].every((pl) => pl.ready)) return;
    this._emit(SERVER.ALL_READY, {});
    this._startCountdown();
  }

  _startCountdown() {
    this.state = ROOM_STATES.COUNTDOWN;
    let count = 3;
    this._emit(SERVER.COUNTDOWN_START, { count });
    this._countdownInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(this._countdownInterval);
        this._countdownInterval = null;
        this._startGame();
      } else {
        this._emit(SERVER.COUNTDOWN_START, { count });
      }
    }, 1000);
  }

  _startGame() {
    const maze = MazeGenerator.generate(this.players.size);
    this.maze = maze;
    this.powerUps = maze.powerUps;

    // Assign spawn positions
    const spawns = maze.spawnPoints;
    let i = 0;
    for (const [, p] of this.players) {
      const spawn = spawns[i % spawns.length];
      p.x = spawn.x;
      p.y = spawn.y;
      p.alive = true;
      i++;
    }

    this.state = ROOM_STATES.PLAYING;
    this.timeRemaining = this.roundSeconds;
    this._startedAt = Date.now();

    this._emit(SERVER.GAME_START, {
      maze: { width: maze.width, height: maze.height, grid: maze.grid },
      players: this._publicPlayers(),
      timeRemaining: this.timeRemaining,
      mode: this.mode,
      difficulty: this.difficulty,
    });

    this._tickInterval = setInterval(() => this._tick(), TICK_RATE);
  }

  _tick() {
    if (this.state !== ROOM_STATES.PLAYING) return;

    const now = Date.now();
    const elapsed = (now - this._startedAt) / 1000;
    this.timeRemaining = Math.max(0, this.roundSeconds - elapsed);

    // Tick all active sprays
    const sprayEvents = [];
    for (const [id, spray] of this.sprays) {
      const result = spray.tick(now);
      if (result.expanded) {
        this._processSprayExpansion(spray, result.tiles);
        sprayEvents.push({ type: 'expanded', sprayId: id, tiles: result.tiles, playerId: spray.playerId });
      }
      if (result.done) {
        const p = this.players.get(spray.playerId);
        if (p) p.activeSprayCount = Math.max(0, p.activeSprayCount - 1);
        this.sprays.delete(id);
        sprayEvents.push({ type: 'expired', sprayId: id });
      }
    }

    for (const p of this.players.values()) {
      if (!p.bot || !p.alive || p.inChamber) continue;
      const action = p.bot.decide(this, p, now);
      if (action?.type === 'move') this.handleMove(p.socketId, action.dir);
      else if (action?.type === 'spray') this.handleSpray(p.socketId);
    }

    // The clock goes out once a second; spray news goes out straight away.
    const second = Math.ceil(this.timeRemaining);
    if (sprayEvents.length > 0 || second !== this._lastSecond) {
      this._lastSecond = second;
      this._emit(SERVER.GAME_TICK, {
        timeRemaining: this.timeRemaining,
        ...(sprayEvents.length > 0 && { sprayEvents }),
      });
    }

    if (this.timeRemaining <= 0) {
      this._endGame();
    }
  }

  _processSprayExpansion(spray, tiles) {
    for (const tile of tiles) {
      // Break destructible walls
      if (tile.breaksWall && this.maze.grid[tile.y][tile.x] === TILE.DESTRUCTIBLE) {
        this.maze.grid[tile.y][tile.x] = TILE.EMPTY;
        const sprayer = this.players.get(spray.playerId);
        if (sprayer) sprayer.score += SCORE.BREAK_WALL;

        const pu = this.powerUps.find((p) => p.x === tile.x && p.y === tile.y);
        if (pu) {
          pu.visible = true;
          this._emit(SERVER.POWERUP_SPAWNED, { x: pu.x, y: pu.y, type: pu.type });
        }
        this._emit(SERVER.WALL_BROKEN, { x: tile.x, y: tile.y });
      }

      // Hit players
      for (const [socketId, player] of this.players) {
        if (!player.alive || player.inChamber) continue;
        if (socketId === spray.playerId) continue;
        if (player.x !== tile.x || player.y !== tile.y) continue;

        if (player.hasShield && Date.now() < player.shieldExpiry) continue;

        this._steamPlayer(socketId, spray.playerId);
      }
    }
  }

  _steamPlayer(victimId, attackerId) {
    const victim = this.players.get(victimId);
    const attacker = this.players.get(attackerId);
    if (!victim || !attacker) return;

    victim.alive = false;
    victim.inChamber = true;
    attacker.score += SCORE.STEAM_OPPONENT;
    attacker.steamCount++;
    victim.steamed++;

    this._emit(SERVER.PLAYER_STEAMED, {
      victimId,
      attackerId,
      attackerScore: attacker.score,
    });

    this._emit(SERVER.SCORE_UPDATE, { playerId: attackerId, score: attacker.score });

    this._sendChamberQuestion(victimId);
  }

  async _sendChamberQuestion(socketId) {
    const player = this.players.get(socketId);
    if (!player || this.state !== ROOM_STATES.PLAYING) return;

    const subject = this.mode === 'mixed'
      ? (Math.random() < 0.5 ? 'maths' : 'literacy')
      : this.mode;

    let question = null;
    try {
      question = await questionService.getRandomQuestion({
        subject,
        difficulty: this.difficulty,
        classRoomId: this.classRoomId,
        excludeIds: player.recentQuestions,
      });
    } catch (err) {
      console.error('Failed to load a chamber question:', err.message);
    }

    // The round may have ended, or the player left, while the question loaded.
    if (this.state !== ROOM_STATES.PLAYING || this.players.get(socketId) !== player || !player.inChamber) return;

    // Never leave a child stuck in the chamber because the question bank is empty.
    if (!question) {
      this._later(() => this._respawnPlayer(socketId, { shield: true }), 2000);
      return;
    }

    const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    player.recentQuestions = [...player.recentQuestions, question.id].slice(-10);
    player.chamberQuestion = { id: question.id, options, startTime: Date.now() };
    player.chamberTimeout = this._later(() => this._onChamberTimeout(socketId), CHAMBER_TIMEOUT * 1000);

    if (player.bot) {
      const { index, delay } = player.bot.answer(options, BOT_ACCURACY[this.difficulty] || 0.7);
      const asked = player.chamberQuestion;
      this._later(() => {
        if (player.chamberQuestion === asked) this.handleChamberAnswer(socketId, index);
      }, delay);
      return;
    }

    this.io.to(socketId).emit(SERVER.CHAMBER_QUESTION, {
      questionId: question.id,
      questionText: question.questionText,
      options: options.map((o, i) => ({ index: i, text: o.text })),
      timeLimit: CHAMBER_TIMEOUT,
    });
  }

  async handleChamberAnswer(socketId, answerIndex) {
    if (this.state !== ROOM_STATES.PLAYING) return;
    const player = this.players.get(socketId);
    if (!player || !player.inChamber || !player.chamberQuestion) return;
    if (!Number.isInteger(answerIndex)) return;

    // One answer per question: clearing it first stops a client from trying every option.
    const question = player.chamberQuestion;
    player.chamberQuestion = null;
    this._clearTimer(player.chamberTimeout);

    const elapsed = (Date.now() - question.startTime) / 1000;
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = question.options[answerIndex]?.isCorrect === true;

    player.questionsAnswered++;
    questionService.recordAnswer(question.id, isCorrect);

    if (isCorrect) {
      player.questionsCorrect++;
      player.answerStreak++;
      player.score += SCORE.CORRECT_ANSWER;
      player.answerTimes.push(elapsed * 1000);

      const bonuses = [];
      if (elapsed <= FAST_ANSWER_THRESHOLD) {
        player.score += SCORE.FAST_ANSWER_BONUS;
        bonuses.push('speed');
      }
      if (player.answerStreak > 0 && player.answerStreak % 3 === 0) {
        player.score += SCORE.STREAK_BONUS;
        bonuses.push('streak');
      }

      this.io.to(socketId).emit(SERVER.CHAMBER_CORRECT, {
        score: player.score,
        streak: player.answerStreak,
        bonuses,
        fastAnswer: elapsed <= FAST_ANSWER_THRESHOLD,
      });

      this._emit(SERVER.SCORE_UPDATE, { playerId: socketId, score: player.score });

      // Respawn
      this._respawnPlayer(socketId, {
        shield: true,
        speedBoost: elapsed <= FAST_ANSWER_THRESHOLD,
      });
    } else {
      player.answerStreak = 0;
      this.io.to(socketId).emit(SERVER.CHAMBER_WRONG, {
        correctAnswer: correctOption?.text,
        waitSeconds: CHAMBER_WRONG_PENALTY,
      });

      this._later(() => {
        if (this.players.get(socketId) === player && player.inChamber) {
          this._sendChamberQuestion(socketId);
        }
      }, CHAMBER_WRONG_PENALTY * 1000);
    }
  }

  _onChamberTimeout(socketId) {
    const player = this.players.get(socketId);
    if (!player || !player.inChamber) return;
    player.chamberQuestion = null;
    player.answerStreak = 0;
    this.io.to(socketId).emit(SERVER.CHAMBER_TIMEOUT, {});
    // Give new question after penalty
    this._later(() => {
      if (this.players.get(socketId) === player && player.inChamber) {
        this._sendChamberQuestion(socketId);
      }
    }, CHAMBER_WRONG_PENALTY * 1000);
  }

  _respawnPlayer(socketId, { shield, speedBoost } = {}) {
    const player = this.players.get(socketId);
    if (!player || this.state !== ROOM_STATES.PLAYING) return;

    const safeSpawn = this._findSafeSpawn(player.x, player.y, socketId);

    player.x = safeSpawn.x;
    player.y = safeSpawn.y;
    player.alive = true;
    player.inChamber = false;
    player.chamberQuestion = null;

    if (shield) {
      player.hasShield = true;
      player.shieldExpiry = Date.now() + SHIELD_DURATION;
    }
    if (speedBoost) {
      player.speed = (player.speed || 1.0) + 0.3;
      this._later(() => { player.speed = Math.max(1.0, player.speed - 0.3); }, SPEED_BONUS_DURATION);
    }

    this._emit(SERVER.PLAYER_RESPAWNED, {
      playerId: socketId,
      x: player.x,
      y: player.y,
      shield,
      shieldMs: shield ? SHIELD_DURATION : 0,
      speedBoost,
    });
  }

  // The nearest open tile that no one stands on and no unburst spray covers.
  _findSafeSpawn(prefX, prefY, socketId) {
    const { grid, width, height } = this.maze;
    const soaked = new Set();
    for (const spray of this.sprays.values()) {
      if (spray.playerId === socketId) continue;
      for (const t of spray.previewTiles()) soaked.add(`${t.x},${t.y}`);
    }
    for (let r = 1; r < Math.max(width, height); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = prefX + dx;
          const ty = prefY + dy;
          if (tx < 1 || ty < 1 || tx >= width - 1 || ty >= height - 1) continue;
          if (grid[ty][tx] !== TILE.EMPTY || soaked.has(`${tx},${ty}`)) continue;
          let blocked = false;
          for (const [, p] of this.players) {
            if (p.socketId !== socketId && p.x === tx && p.y === ty) { blocked = true; break; }
          }
          if (!blocked) return { x: tx, y: ty };
        }
      }
    }
    return { x: 1, y: 1 };
  }

  handleMove(socketId, direction) {
    if (this.state !== ROOM_STATES.PLAYING) return;
    const player = this.players.get(socketId);
    if (!player || !player.alive || player.inChamber) return;

    // Speed decides how often a player may step; a little slack absorbs network jitter.
    const now = Date.now();
    if (now - player.lastMoveAt < (MOVE_INTERVAL / (player.speed || 1)) * 0.75) return;

    const moved = movePlayer(player, direction, this.maze);
    if (!moved) return;
    player.lastMoveAt = now;

    // Check powerup collection
    const pu = checkPowerUpCollect(player, this.powerUps.filter((p) => p.visible && !p.collected));
    if (pu) {
      pu.collected = true;
      applyPowerUp(player, pu.type);
      this._emit(SERVER.POWERUP_COLLECTED, {
        playerId: socketId,
        type: pu.type,
        x: pu.x,
        y: pu.y,
        stats: {
          waterCapacity: player.waterCapacity,
          sprayRange: player.sprayRange,
          speed: player.speed,
          superSprayReady: player.superSprayReady,
          shieldMs: player.hasShield ? Math.max(0, player.shieldExpiry - now) : 0,
        },
      });
    }

    this._emit(SERVER.PLAYER_MOVED, {
      playerId: socketId,
      x: player.x,
      y: player.y,
      direction: player.direction,
    });
  }

  handleSpray(socketId) {
    if (this.state !== ROOM_STATES.PLAYING) return;
    const player = this.players.get(socketId);
    if (!player || !player.alive || player.inChamber) return;

    const now = Date.now();
    if (now - player.lastSprayAt < player.reloadTime) return;
    if (player.activeSprayCount >= player.waterCapacity) return;

    player.lastSprayAt = now;
    player.activeSprayCount++;

    const range = player.superSprayReady ? 99 : player.sprayRange;
    if (player.superSprayReady) player.superSprayReady = false;

    const sprayId = uuidv4();
    const spray = new WaterSpray({
      id: sprayId,
      playerId: socketId,
      x: player.x,
      y: player.y,
      range,
      maze: this.maze,
    });

    this.sprays.set(sprayId, spray);
    this._emit(SERVER.SPRAY_PLACED, {
      sprayId,
      playerId: socketId,
      x: player.x,
      y: player.y,
      range,
      tiles: spray.previewTiles(),
    });
  }

  _endGame() {
    if (this.state === ROOM_STATES.RESULTS) return;
    clearInterval(this._tickInterval);
    this._tickInterval = null;
    this._clearAllTimers();
    this.state = ROOM_STATES.RESULTS;
    this.endedAt = Date.now();

    // Award survival bonus
    for (const [, p] of this.players) {
      if (p.alive && !p.inChamber) {
        p.score += SCORE.SURVIVE_ROUND;
      }
    }

    const results = [...this.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        socketId: p.socketId,
        userId: p.userId,
        displayName: p.displayName,
        isBot: p.isBot,
        colorIndex: p.colorIndex,
        score: Math.round(p.score * 100) / 100,
        placement: i + 1,
        steamCount: p.steamCount,
        steamed: p.steamed,
        questionsAnswered: p.questionsAnswered,
        questionsCorrect: p.questionsCorrect,
        avgAnswerTimeMs: p.answerTimes.length
          ? p.answerTimes.reduce((a, b) => a + b, 0) / p.answerTimes.length
          : null,
      }));

    this._emit(SERVER.ROUND_RESULTS, { results, winnerId: results[0]?.socketId });

    // Persist to DB async
    this._persistSession(results).catch(console.error);
  }

  // Stops every timer; the matchmaker drops closed rooms.
  close() {
    clearInterval(this._tickInterval);
    clearInterval(this._countdownInterval);
    this._tickInterval = null;
    this._countdownInterval = null;
    this._clearAllTimers();
    if (this.state !== ROOM_STATES.RESULTS) this.endedAt = Date.now();
    this.state = ROOM_STATES.RESULTS;
    this.closed = true;
  }

  async _persistSession(results) {
    try {
      const { GameSession, GameSessionPlayer, User } = require('../models');
      const session = await GameSession.create({
        roomId: this.roomId,
        mode: this.mode,
        difficulty: this.difficulty,
        playerCount: results.length,
        durationSeconds: Math.round(this.roundSeconds - this.timeRemaining),
        startedAt: new Date(this._startedAt),
        endedAt: new Date(),
        winnerId: results[0]?.userId || null,
      });

      await GameSessionPlayer.bulkCreate(results.map((r) => ({
        gameSessionId: session.id,
        userId: r.userId || null,
        guestId: r.userId ? null : (r.isBot ? 'bot' : r.socketId),
        displayName: r.displayName,
        finalScore: r.score,
        steamCount: r.steamCount,
        steamed: r.steamed,
        questionsAnswered: r.questionsAnswered,
        questionsCorrect: r.questionsCorrect,
        avgAnswerTimeMs: r.avgAnswerTimeMs,
        placement: r.placement,
      })));

      // Update user stats
      for (const r of results) {
        if (!r.userId) continue;
        const user = await User.findByPk(r.userId);
        if (!user) continue;
        const totalScore = user.totalScore + r.score;
        await user.update({
          totalScore,
          gamesPlayed: user.gamesPlayed + 1,
          coins: user.coins + Math.floor(r.score * 5),
          xp: user.xp + Math.round(r.score * 10),
          level: 1 + Math.floor(totalScore / 25),
        });
      }
    } catch (err) {
      console.error('Failed to persist game session:', err.message);
    }
  }

  _publicPlayer(socketId) {
    const p = this.players.get(socketId);
    if (!p) return null;
    return {
      socketId: p.socketId,
      displayName: p.displayName,
      isPremium: p.isPremium,
      isBot: p.isBot,
      colorIndex: p.colorIndex,
      avatar: p.avatar,
      x: p.x,
      y: p.y,
      direction: p.direction,
      score: p.score,
      alive: p.alive,
      waterCapacity: p.waterCapacity,
      sprayRange: p.sprayRange,
      speed: p.speed,
      hasShield: p.hasShield,
      inChamber: p.inChamber,
    };
  }

  _publicPlayers() {
    const result = {};
    for (const [id] of this.players) {
      result[id] = this._publicPlayer(id);
    }
    return result;
  }

  _later(fn, ms) {
    const t = setTimeout(() => {
      this._timers.delete(t);
      fn();
    }, ms);
    this._timers.add(t);
    return t;
  }

  _clearTimer(t) {
    if (!t) return;
    clearTimeout(t);
    this._timers.delete(t);
  }

  _clearAllTimers() {
    for (const t of this._timers) clearTimeout(t);
    this._timers.clear();
    for (const p of this.players.values()) p.chamberTimeout = null;
  }

  _emit(event, data) {
    this.io.to(this.roomId).emit(event, data);
  }
}

module.exports = GameRoom;
