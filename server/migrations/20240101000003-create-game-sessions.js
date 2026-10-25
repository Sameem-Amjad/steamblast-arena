'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('game_sessions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      roomId: { type: Sequelize.STRING, allowNull: false },
      mode: { type: Sequelize.ENUM('maths', 'literacy', 'mixed'), allowNull: false },
      difficulty: { type: Sequelize.INTEGER, allowNull: false },
      playerCount: { type: Sequelize.INTEGER, allowNull: false },
      durationSeconds: { type: Sequelize.INTEGER },
      startedAt: { type: Sequelize.DATE },
      endedAt: { type: Sequelize.DATE },
      winnerId: { type: Sequelize.UUID, allowNull: true },
      mazeSnapshot: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('game_session_players', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      gameSessionId: { type: Sequelize.UUID, allowNull: false, references: { model: 'game_sessions', key: 'id' } },
      userId: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      guestId: { type: Sequelize.STRING, allowNull: true },
      displayName: { type: Sequelize.STRING, allowNull: false },
      finalScore: { type: Sequelize.FLOAT, defaultValue: 0 },
      steamCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      steamed: { type: Sequelize.INTEGER, defaultValue: 0 },
      questionsAnswered: { type: Sequelize.INTEGER, defaultValue: 0 },
      questionsCorrect: { type: Sequelize.INTEGER, defaultValue: 0 },
      avgAnswerTimeMs: { type: Sequelize.FLOAT, allowNull: true },
      placement: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('game_session_players');
    await queryInterface.dropTable('game_sessions');
  },
};
