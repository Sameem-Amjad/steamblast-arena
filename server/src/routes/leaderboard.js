const express = require('express');
const { User, ClassRoom, ClassRoomStudent } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');
const sequelize = require('../config/database');

const router = express.Router();

router.get('/global', optionalAuth, async (req, res) => {
  try {
    const players = await User.findAll({
      where: { isGuest: false },
      attributes: ['id', 'displayName', 'totalScore', 'gamesPlayed', 'level', 'isPremium', 'avatar'],
      order: [['totalScore', 'DESC']],
      limit: 100,
    });
    res.json({ leaderboard: players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/class/:classRoomId', authenticate, async (req, res) => {
  try {
    const classroom = await ClassRoom.findByPk(req.params.classRoomId, {
      include: [{
        association: 'students',
        attributes: ['id', 'displayName', 'totalScore', 'gamesPlayed', 'level', 'isPremium'],
      }],
    });
    if (!classroom) return res.status(404).json({ error: 'Classroom not found.' });

    const students = classroom.students.sort((a, b) => b.totalScore - a.totalScore);
    res.json({ leaderboard: students, classroom: { id: classroom.id, name: classroom.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
