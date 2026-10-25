'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, unique: true, allowNull: true },
      passwordHash: { type: Sequelize.STRING, allowNull: true },
      displayName: { type: Sequelize.STRING(32), allowNull: false },
      isGuest: { type: Sequelize.BOOLEAN, defaultValue: false },
      role: { type: Sequelize.ENUM('student', 'teacher', 'admin'), defaultValue: 'student' },
      isPremium: { type: Sequelize.BOOLEAN, defaultValue: false },
      coins: { type: Sequelize.INTEGER, defaultValue: 0 },
      level: { type: Sequelize.INTEGER, defaultValue: 1 },
      xp: { type: Sequelize.INTEGER, defaultValue: 0 },
      totalScore: { type: Sequelize.FLOAT, defaultValue: 0 },
      gamesPlayed: { type: Sequelize.INTEGER, defaultValue: 0 },
      preferredDifficulty: { type: Sequelize.INTEGER, defaultValue: 1 },
      preferredMode: { type: Sequelize.STRING, defaultValue: 'mixed' },
      avatar: { type: Sequelize.JSONB, defaultValue: {} },
      equippedItems: { type: Sequelize.JSONB, defaultValue: {} },
      stripeCustomerId: { type: Sequelize.STRING, allowNull: true },
      lastLoginAt: { type: Sequelize.DATE, allowNull: true },
      parentEmail: { type: Sequelize.STRING, allowNull: true },
      dailyTimeLimit: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['displayName']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
