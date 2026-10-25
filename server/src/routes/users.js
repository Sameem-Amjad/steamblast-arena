const express = require('express');
const { body } = require('express-validator');
const Filter = require('bad-words');
const { User, GameSession, GameSessionPlayer } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();
const filter = new Filter();

router.get('/profile', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{ association: 'subscription' }],
  });
  res.json({ user: user.toPublic() });
});

router.patch('/profile',
  authenticate,
  [
    body('displayName').optional().trim().isLength({ min: 2, max: 32 }),
    body('preferredDifficulty').optional().isInt({ min: 1, max: 3 }),
    body('preferredMode').optional().isIn(['maths', 'literacy', 'mixed']),
    body('avatar').optional().isObject(),
  ],
  validate,
  async (req, res) => {
    try {
      const { displayName, preferredDifficulty, preferredMode, avatar } = req.body;

      if (displayName) {
        if (!req.user.isPremium) {
          return res.status(403).json({ error: 'Custom names require a premium subscription.' });
        }
        if (filter.isProfane(displayName)) {
          return res.status(422).json({ error: 'Display name contains inappropriate content.' });
        }
      }

      await req.user.update({
        ...(displayName && { displayName }),
        ...(preferredDifficulty && { preferredDifficulty }),
        ...(preferredMode && { preferredMode }),
        ...(avatar && { avatar }),
      });

      res.json({ user: req.user.toPublic() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get('/stats', authenticate, async (req, res) => {
  try {
    const sessions = await GameSessionPlayer.findAll({
      where: { userId: req.user.id },
      include: [{ model: GameSession, attributes: ['mode', 'difficulty', 'startedAt'] }],
      order: [[GameSession, 'startedAt', 'DESC']],
      limit: 50,
    });

    const totalGames = sessions.length;
    const totalScore = sessions.reduce((s, p) => s + p.finalScore, 0);
    const totalCorrect = sessions.reduce((s, p) => s + p.questionsCorrect, 0);
    const totalAnswered = sessions.reduce((s, p) => s + p.questionsAnswered, 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    res.json({
      totalGames,
      totalScore,
      accuracy,
      totalCorrect,
      totalAnswered,
      recentSessions: sessions.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/equipped-items',
  authenticate,
  [body('equippedItems').isObject()],
  validate,
  async (req, res) => {
    try {
      if (!req.user.isPremium) {
        return res.status(403).json({ error: 'Equipping items requires a premium subscription.' });
      }
      await req.user.update({ equippedItems: req.body.equippedItems });
      res.json({ equippedItems: req.user.equippedItems });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin: list users
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  const { page = 1, limit = 50, role } = req.query;
  const where = role ? { role } : {};
  const users = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']],
    attributes: { exclude: ['passwordHash', 'stripeCustomerId'] },
  });
  res.json(users);
});

module.exports = router;
