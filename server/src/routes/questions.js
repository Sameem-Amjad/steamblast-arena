const express = require('express');
const { body, query } = require('express-validator');
const { Op } = require('sequelize');
const { Question } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Public: get questions filtered by subject/difficulty (for game engine)
router.get('/',
  authenticate,
  [
    query('subject').optional().isIn(['maths', 'literacy']),
    query('difficulty').optional().isInt({ min: 1, max: 3 }),
    query('topic').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { subject, difficulty, topic, limit = 10 } = req.query;
      const where = { isActive: true };
      if (subject) where.subject = subject;
      if (difficulty) where.difficulty = parseInt(difficulty);
      if (topic) where.topic = topic;

      const questions = await Question.findAll({
        where,
        order: sequelize.random ? [sequelize.fn('RANDOM')] : [['id', 'ASC']],
        limit: parseInt(limit),
      });
      res.json({ questions });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin/Teacher: create question
router.post('/',
  authenticate,
  requireRole('teacher', 'admin'),
  [
    body('subject').isIn(['maths', 'literacy']),
    body('topic').notEmpty(),
    body('difficulty').isInt({ min: 1, max: 3 }),
    body('questionText').trim().isLength({ min: 5 }),
    body('options').isArray({ min: 2, max: 4 }),
    body('options.*.text').notEmpty(),
    body('options.*.isCorrect').isBoolean(),
    body('classRoomId').optional().isUUID(),
  ],
  validate,
  async (req, res) => {
    try {
      const { subject, topic, difficulty, questionText, options, explanation, classRoomId } = req.body;

      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(422).json({ error: 'Exactly one option must be correct.' });
      }

      const question = await Question.create({
        subject, topic, difficulty, questionText, options, explanation,
        isCustom: true,
        createdByTeacherId: req.user.id,
        classRoomId: classRoomId || null,
      });

      res.status(201).json({ question });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.patch('/:id',
  authenticate,
  requireRole('teacher', 'admin'),
  async (req, res) => {
    try {
      const question = await Question.findByPk(req.params.id);
      if (!question) return res.status(404).json({ error: 'Question not found.' });
      if (req.user.role !== 'admin' && question.createdByTeacherId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot edit this question.' });
      }
      await question.update(req.body);
      res.json({ question });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.delete('/:id',
  authenticate,
  requireRole('teacher', 'admin'),
  async (req, res) => {
    try {
      const question = await Question.findByPk(req.params.id);
      if (!question) return res.status(404).json({ error: 'Question not found.' });
      if (req.user.role !== 'admin' && question.createdByTeacherId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot delete this question.' });
      }
      await question.update({ isActive: false });
      res.json({ message: 'Question deactivated.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin: import questions from JSON body array
router.post('/bulk-import',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { questions } = req.body;
      if (!Array.isArray(questions)) return res.status(422).json({ error: 'questions must be an array.' });
      const created = await Question.bulkCreate(questions, { validate: true });
      res.status(201).json({ count: created.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
