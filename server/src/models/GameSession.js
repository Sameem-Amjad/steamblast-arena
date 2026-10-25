const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mode: {
    type: DataTypes.ENUM('maths', 'literacy', 'mixed'),
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  playerCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
  },
  startedAt: {
    type: DataTypes.DATE,
  },
  endedAt: {
    type: DataTypes.DATE,
  },
  winnerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  mazeSnapshot: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'game_sessions',
  timestamps: true,
});

module.exports = GameSession;
