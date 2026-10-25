'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classrooms', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      teacherId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      name: { type: Sequelize.STRING, allowNull: false },
      joinCode: { type: Sequelize.STRING(8), unique: true, allowNull: false },
      difficulty: { type: Sequelize.INTEGER, defaultValue: 1 },
      activeTopics: { type: Sequelize.JSONB, defaultValue: [] },
      activeMode: { type: Sequelize.STRING, defaultValue: 'mixed' },
      premiumEnabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      weeklyReportEnabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('classrooms', ['joinCode']);

    await queryInterface.createTable('classroom_students', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      classRoomId: { type: Sequelize.UUID, allowNull: false, references: { model: 'classrooms', key: 'id' } },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      joinedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('classroom_students');
    await queryInterface.dropTable('classrooms');
  },
};
