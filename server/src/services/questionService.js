const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Question } = require('../models');

async function getRandomQuestion({ subject, difficulty, classRoomId }) {
  const where = { isActive: true, difficulty };
  if (subject) where.subject = subject;

  const queries = [];

  // Prefer class-specific questions if available
  if (classRoomId) {
    queries.push(
      Question.findOne({ where: { ...where, classRoomId }, order: sequelize.literal('RANDOM()') })
    );
  }

  queries.push(
    Question.findOne({ where: { ...where, isCustom: false }, order: sequelize.literal('RANDOM()') })
  );

  for (const q of queries) {
    const result = await q;
    if (result) return result;
  }

  // Fallback: any difficulty
  return Question.findOne({ where: { isActive: true, subject }, order: sequelize.literal('RANDOM()') });
}

async function recordAnswer(questionId, isCorrect) {
  try {
    await Question.increment(
      { timesAnswered: 1, ...(isCorrect ? { timesCorrect: 1 } : {}) },
      { where: { id: questionId } }
    );
  } catch {
    // Non-critical
  }
}

async function getQuestionsForClass(classRoomId, { subject, difficulty, limit = 20 }) {
  const where = { isActive: true };
  if (classRoomId) where.classRoomId = classRoomId;
  if (subject) where.subject = subject;
  if (difficulty) where.difficulty = difficulty;
  return Question.findAll({ where, limit, order: sequelize.literal('RANDOM()') });
}

module.exports = { getRandomQuestion, recordAnswer, getQuestionsForClass };
