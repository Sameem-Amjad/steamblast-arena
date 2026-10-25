const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameSessionPlayer = sequelize.define('GameSessionPlayer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gameSessionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  guestId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  finalScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  steamCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  steamed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  questionsAnswered: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  questionsCorrect: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  avgAnswerTimeMs: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  placement: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'game_session_players',
  timestamps: true,
});

module.exports = GameSessionPlayer;
