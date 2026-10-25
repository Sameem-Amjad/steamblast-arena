const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassRoom = sequelize.define('ClassRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  joinCode: {
    type: DataTypes.STRING(8),
    unique: true,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  activeTopics: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  activeMode: {
    type: DataTypes.STRING,
    defaultValue: 'mixed',
  },
  premiumEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  weeklyReportEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'classrooms',
  timestamps: true,
  indexes: [{ fields: ['joinCode'] }],
});

module.exports = ClassRoom;
