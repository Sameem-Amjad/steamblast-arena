const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  displayName: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: () => `Player_${Math.floor(Math.random() * 9000 + 1000)}`,
  },
  isGuest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    defaultValue: 'student',
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  preferredDifficulty: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1, max: 3 },
  },
  preferredMode: {
    type: DataTypes.STRING,
    defaultValue: 'mixed',
  },
  avatar: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  equippedItems: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  dailyTimeLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['displayName'] },
  ],
});

User.prototype.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash') && user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
  }
});

User.prototype.toPublic = function () {
  const { passwordHash, stripeCustomerId, parentEmail, ...data } = this.toJSON();
  return data;
};

module.exports = User;
