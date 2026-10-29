const TILE = {
  EMPTY: 0,
  WALL: 1,
  DESTRUCTIBLE: 2,
  POWERUP: 3,
};

const POWERUP_TYPES = {
  EXTRA_WATER: 'extra_water',
  RANGE_UP: 'range_up',
  SPEED_BOOST: 'speed_boost',
  SHIELD: 'shield',
  SUPER_SPRAY: 'super_spray',
};

const GAME_MODES = {
  MATHS: 'maths',
  LITERACY: 'literacy',
  MIXED: 'mixed',
};

const DIFFICULTY = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
};

const ROUND_DURATION = 120; // seconds
const CHAMBER_TIMEOUT = 15; // seconds per question
const CHAMBER_WRONG_PENALTY = 5; // seconds wait on wrong answer
const SPRAY_EXPAND_DELAY = 800; // ms before water expands
const SPRAY_TTL = 1500; // ms total spray lifetime
const SHIELD_DURATION = 2000; // ms post-respawn shield
const SPEED_BONUS_DURATION = 3000; // ms speed boost on fast answer
const FAST_ANSWER_THRESHOLD = 5; // seconds
const MOVE_INTERVAL = 150; // ms between steps at speed 1.0
const SHIELD_POWERUP_DURATION = 5000; // ms of protection from a shield power-up

const PLAYER_DEFAULTS = {
  FREE: {
    waterCapacity: 2,
    sprayRange: 2,
    speed: 1.0,
    reloadTime: 1500,
  },
  PREMIUM: {
    waterCapacity: 3,
    sprayRange: 2,
    speed: 1.0,
    reloadTime: 1200,
  },
};

const POWERUP_LIMITS = {
  waterCapacity: 5,
  sprayRange: 5,
  speedStacks: 3,
};

const SCORE = {
  STEAM_OPPONENT: 1,
  CORRECT_ANSWER: 0.5,
  FAST_ANSWER_BONUS: 0.25,
  BREAK_WALL: 0.1,
  SURVIVE_ROUND: 2,
  STREAK_BONUS: 0.5,
};

const MAZE_SIZES = {
  SMALL: { width: 11, height: 11, minPlayers: 2, maxPlayers: 4 },
  LARGE: { width: 15, height: 13, minPlayers: 5, maxPlayers: 8 },
};

const PLAYER_SPAWN_CORNERS = [
  { x: 1, y: 1 },
  { x: 13, y: 11 },
  { x: 13, y: 1 },
  { x: 1, y: 11 },
  { x: 7, y: 1 },
  { x: 7, y: 11 },
  { x: 1, y: 6 },
  { x: 13, y: 6 },
];

const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

const ROOM_STATES = {
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  RESULTS: 'results',
};

const PRESET_EMOTES = [
  'Good game!',
  'Nice shot!',
  'Well played!',
  "Let's go!",
  'GG!',
];

const AVATAR_DEFAULTS = [
  { id: 'default_blue', color: '#4A90D9', name: 'Blue Blaster' },
  { id: 'default_red', color: '#E74C3C', name: 'Red Racer' },
  { id: 'default_green', color: '#2ECC71', name: 'Green Gush' },
  { id: 'default_yellow', color: '#F1C40F', name: 'Yellow Yell' },
  { id: 'default_purple', color: '#9B59B6', name: 'Purple Pour' },
  { id: 'default_orange', color: '#E67E22', name: 'Orange Oops' },
  { id: 'default_pink', color: '#FD79A8', name: 'Pink Plink' },
  { id: 'default_teal', color: '#00B894', name: 'Teal Twirl' },
];

module.exports = {
  TILE,
  POWERUP_TYPES,
  GAME_MODES,
  DIFFICULTY,
  ROUND_DURATION,
  CHAMBER_TIMEOUT,
  CHAMBER_WRONG_PENALTY,
  SPRAY_EXPAND_DELAY,
  SPRAY_TTL,
  SHIELD_DURATION,
  SPEED_BONUS_DURATION,
  FAST_ANSWER_THRESHOLD,
  MOVE_INTERVAL,
  SHIELD_POWERUP_DURATION,
  PLAYER_DEFAULTS,
  POWERUP_LIMITS,
  SCORE,
  MAZE_SIZES,
  PLAYER_SPAWN_CORNERS,
  DIRECTIONS,
  ROOM_STATES,
  PRESET_EMOTES,
  AVATAR_DEFAULTS,
};
