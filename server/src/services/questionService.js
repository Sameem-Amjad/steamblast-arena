const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Question } = require('../models');

const random = () => sequelize.literal('RANDOM()');

async function getRandomQuestion({ subject, difficulty, classRoomId, excludeIds = [] }) {
  const where = { isActive: true, difficulty };
  if (subject) where.subject = subject;
  // Skip the questions this player saw last, as long as others are left.
  const fresh = excludeIds.length ? { id: { [Op.notIn]: excludeIds } } : {};

  const queries = [];

  // Prefer class-specific questions if available
  if (classRoomId) {
    queries.push({ ...where, ...fresh, classRoomId });
  }

  queries.push({ ...where, ...fresh, isCustom: false });
  queries.push({ ...where, isCustom: false });

  for (const q of queries) {
    const result = await Question.findOne({ where: q, order: random() });
    if (result) return result;
  }

  // Fallback: any difficulty
  return Question.findOne({ where: { isActive: true, subject }, order: random() });
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
  return Question.findAll({ where, limit, order: random() });
}

module.exports = { getRandomQuestion, recordAnswer, getQuestionsForClass };
