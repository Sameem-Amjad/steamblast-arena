const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject: {
    type: DataTypes.ENUM('maths', 'literacy'),
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 3 },
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false,
    // Array of { text: string, isCorrect: boolean }
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  curriculumTag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isCustom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdByTeacherId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  classRoomId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  timesAnswered: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  timesCorrect: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'questions',
  timestamps: true,
  indexes: [
    { fields: ['subject', 'difficulty'] },
    { fields: ['topic'] },
    { fields: ['classRoomId'] },
  ],
});

Question.prototype.getCorrectAnswer = function () {
  return this.options.find((o) => o.isCorrect);
};

module.exports = Question;
