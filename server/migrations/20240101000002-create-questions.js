'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('questions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      subject: { type: Sequelize.ENUM('maths', 'literacy'), allowNull: false },
      topic: { type: Sequelize.STRING, allowNull: false },
      difficulty: { type: Sequelize.INTEGER, allowNull: false },
      questionText: { type: Sequelize.TEXT, allowNull: false },
      options: { type: Sequelize.JSONB, allowNull: false },
      explanation: { type: Sequelize.TEXT, allowNull: true },
      curriculumTag: { type: Sequelize.STRING, allowNull: true },
      isCustom: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdByTeacherId: { type: Sequelize.UUID, allowNull: true },
      classRoomId: { type: Sequelize.UUID, allowNull: true },
      timesAnswered: { type: Sequelize.INTEGER, defaultValue: 0 },
      timesCorrect: { type: Sequelize.INTEGER, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('questions', ['subject', 'difficulty']);
    await queryInterface.addIndex('questions', ['topic']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('questions');
  },
};
