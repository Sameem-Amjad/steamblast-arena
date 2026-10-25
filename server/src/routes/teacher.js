const express = require('express');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { ClassRoom, ClassRoomStudent, User, GameSessionPlayer, GameSession, Question } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Create classroom
router.post('/classrooms',
  authenticate,
  requireRole('teacher', 'admin'),
  [
    body('name').trim().isLength({ min: 1, max: 80 }),
    body('difficulty').optional().isInt({ min: 1, max: 3 }),
    body('activeMode').optional().isIn(['maths', 'literacy', 'mixed']),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, difficulty, activeMode } = req.body;
      let joinCode;
      let attempt = 0;
      do {
        joinCode = generateJoinCode();
        attempt++;
      } while (await ClassRoom.findOne({ where: { joinCode } }) && attempt < 10);

      const classroom = await ClassRoom.create({
        teacherId: req.user.id,
        name,
        joinCode,
        difficulty: difficulty || 1,
        activeMode: activeMode || 'mixed',
      });

      res.status(201).json({ classroom });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// List teacher's classrooms
router.get('/classrooms', authenticate, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const classrooms = await ClassRoom.findAll({
      where: { teacherId: req.user.id },
      include: [{ association: 'students', attributes: ['id', 'displayName', 'isPremium'] }],
    });
    res.json({ classrooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get classroom details + analytics
router.get('/classrooms/:id', authenticate, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const classroom = await ClassRoom.findByPk(req.params.id, {
      include: [{ association: 'students', attributes: ['id', 'displayName', 'totalScore', 'gamesPlayed', 'preferredDifficulty', 'isPremium'] }],
    });
    if (!classroom || classroom.teacherId !== req.user.id) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const analytics = await analyticsService.getClassroomAnalytics(classroom.id);
    res.json({ classroom, analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update classroom settings
router.patch('/classrooms/:id',
  authenticate,
  requireRole('teacher', 'admin'),
  async (req, res) => {
    try {
      const classroom = await ClassRoom.findByPk(req.params.id);
      if (!classroom || classroom.teacherId !== req.user.id) {
        return res.status(404).json({ error: 'Classroom not found.' });
      }
      const allowed = ['name', 'difficulty', 'activeTopics', 'activeMode', 'premiumEnabled', 'weeklyReportEnabled'];
      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allowed.includes(k))
      );
      await classroom.update(updates);
      res.json({ classroom });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Student joins a classroom by code
router.post('/join',
  authenticate,
  [body('joinCode').trim().isLength({ min: 8, max: 8 })],
  validate,
  async (req, res) => {
    try {
      const classroom = await ClassRoom.findOne({ where: { joinCode: req.body.joinCode.toUpperCase() } });
      if (!classroom) return res.status(404).json({ error: 'Invalid class code.' });

      const already = await ClassRoomStudent.findOne({
        where: { classRoomId: classroom.id, studentId: req.user.id },
      });
      if (already) return res.status(409).json({ error: 'You are already in this class.' });

      await ClassRoomStudent.create({ classRoomId: classroom.id, studentId: req.user.id });
      res.json({ classroom: { id: classroom.id, name: classroom.name } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Student performance report for a specific student in a classroom
router.get('/classrooms/:classId/students/:studentId/report',
  authenticate,
  requireRole('teacher', 'admin'),
  async (req, res) => {
    try {
      const report = await analyticsService.getStudentReport(req.params.studentId, req.params.classId);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
