// Client → Server events
const CLIENT = {
  // Room management
  JOIN_MATCHMAKING: 'join_matchmaking',
  LEAVE_MATCHMAKING: 'leave_matchmaking',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  READY: 'ready',

  // In-game player actions
  PLAYER_MOVE: 'player_move',
  PLAYER_SPRAY: 'player_spray',
  PLAYER_EMOTE: 'player_emote',

  // Chamber (question answering)
  CHAMBER_ANSWER: 'chamber_answer',
};

// Server → Client events
const SERVER = {
  // Room & matchmaking
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  MATCHMAKING_UPDATE: 'matchmaking_update',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ALL_READY: 'all_ready',

  // Game lifecycle
  COUNTDOWN_START: 'countdown_start',
  GAME_START: 'game_start',
  GAME_TICK: 'game_tick',
  GAME_END: 'game_end',
  ROUND_RESULTS: 'round_results',

  // Game state updates
  PLAYER_MOVED: 'player_moved',
  SPRAY_PLACED: 'spray_placed',
  SPRAY_EXPLODED: 'spray_exploded',
  PLAYER_STEAMED: 'player_steamed',
  PLAYER_RESPAWNED: 'player_respawned',
  WALL_BROKEN: 'wall_broken',
  POWERUP_SPAWNED: 'powerup_spawned',
  POWERUP_COLLECTED: 'powerup_collected',
  SCORE_UPDATE: 'score_update',

  // Chamber
  CHAMBER_QUESTION: 'chamber_question',
  CHAMBER_CORRECT: 'chamber_correct',
  CHAMBER_WRONG: 'chamber_wrong',
  CHAMBER_TIMEOUT: 'chamber_timeout',

  // Chat/emotes
  PLAYER_EMOTE: 'player_emote',

  // Errors
  ERROR: 'error',
};

module.exports = { CLIENT, SERVER };
