const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, GameSessionPlayer, GameSession, ClassRoomStudent, Question } = require('../models');

async function getClassroomAnalytics(classRoomId) {
  const students = await ClassRoomStudent.findAll({ where: { classRoomId } });
  const studentIds = students.map((s) => s.studentId);

  if (studentIds.length === 0) return { students: [], heatmap: [] };

  const sessions = await GameSessionPlayer.findAll({
    where: { userId: { [Op.in]: studentIds } },
    include: [{ model: GameSession, attributes: ['mode', 'difficulty', 'startedAt'] }],
    order: [[GameSession, 'startedAt', 'DESC']],
  });

  const studentStats = {};
  for (const sid of studentIds) {
    const user = await User.findByPk(sid, {
      attributes: ['id', 'displayName', 'totalScore', 'gamesPlayed'],
    });
    const playerSessions = sessions.filter((s) => s.userId === sid);
    const totalAnswered = playerSessions.reduce((a, s) => a + s.questionsAnswered, 0);
    const totalCorrect = playerSessions.reduce((a, s) => a + s.questionsCorrect, 0);
    studentStats[sid] = {
      user: user?.toJSON(),
      gamesPlayed: playerSessions.length,
      totalAnswered,
      totalCorrect,
      accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      avgScore: playerSessions.length > 0
        ? playerSessions.reduce((a, s) => a + s.finalScore, 0) / playerSessions.length
        : 0,
    };
  }

  return {
    students: Object.values(studentStats),
    totalGamesPlayed: sessions.length,
  };
}

async function getStudentReport(studentId, classRoomId) {
  const user = await User.findByPk(studentId, {
    attributes: ['id', 'displayName', 'totalScore', 'gamesPlayed', 'level'],
  });

  const sessions = await GameSessionPlayer.findAll({
    where: { userId: studentId },
    include: [{ model: GameSession, attributes: ['mode', 'difficulty', 'startedAt'] }],
    order: [[GameSession, 'startedAt', 'DESC']],
    limit: 30,
  });

  const totalAnswered = sessions.reduce((a, s) => a + s.questionsAnswered, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.questionsCorrect, 0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Weekly breakdown
  const weeklyData = {};
  for (const s of sessions) {
    const week = s.GameSession?.startedAt?.toISOString().slice(0, 10) || 'unknown';
    if (!weeklyData[week]) weeklyData[week] = { answered: 0, correct: 0 };
    weeklyData[week].answered += s.questionsAnswered;
    weeklyData[week].correct += s.questionsCorrect;
  }

  return {
    user: user?.toJSON(),
    totalGames: sessions.length,
    totalAnswered,
    totalCorrect,
    accuracy,
    weeklyData,
    recentSessions: sessions.slice(0, 5).map((s) => ({
      date: s.GameSession?.startedAt,
      mode: s.GameSession?.mode,
      score: s.finalScore,
      questionsAnswered: s.questionsAnswered,
      questionsCorrect: s.questionsCorrect,
    })),
  };
}

// Minutes of finished rounds a player has played since midnight (server time).
async function minutesPlayedToday(userId) {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const rows = await GameSessionPlayer.findAll({
    where: { userId },
    include: [{ model: GameSession, attributes: ['durationSeconds'], where: { startedAt: { [Op.gte]: midnight } } }],
  });
  return rows.reduce((sum, r) => sum + (r.GameSession?.durationSeconds || 0), 0) / 60;
}

module.exports = { getClassroomAnalytics, getStudentReport, minutesPlayedToday };
