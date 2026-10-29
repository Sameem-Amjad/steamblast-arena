'use strict';
const { v4: uuidv4 } = require('uuid');
const questions = require('./data/questions');

const now = new Date();

const rows = questions.map((q) => ({
  id: uuidv4(),
  ...q,
  options: JSON.stringify(q.options),
  explanation: null,
  curriculumTag: null,
  isCustom: false,
  createdByTeacherId: null,
  classRoomId: null,
  timesAnswered: 0,
  timesCorrect: 0,
  isActive: true,
  createdAt: now,
  updatedAt: now,
}));

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('questions', rows);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('questions', { isCustom: false });
  },
};
