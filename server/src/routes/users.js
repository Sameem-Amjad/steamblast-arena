const express = require('express');
const { body } = require('express-validator');
const Filter = require('bad-words');
const { User, GameSession, GameSessionPlayer } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const env = require('../config/env');
const { isDemoAccount, maskEmail } = require('../demo/accounts');
const { minutesPlayedToday } = require('../services/analyticsService');

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
    body('dailyTimeLimit').optional({ values: 'null' }).isInt({ min: 0, max: 600 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { displayName, preferredDifficulty, preferredMode, avatar, dailyTimeLimit } = req.body;

      // Visitors share the demo logins, so one of them mustn't lock the rest out.
      if (dailyTimeLimit !== undefined && env.DEMO_MODE && isDemoAccount(req.user)) {
        return res.status(403).json({ error: 'Time limits are fixed on the shared demo accounts. Create your own account to try them.' });
      }

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
        ...(dailyTimeLimit !== undefined && { dailyTimeLimit: dailyTimeLimit || null }),
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
      minutesToday: Math.round(await minutesPlayedToday(req.user.id)),
      dailyTimeLimit: req.user.dailyTimeLimit,
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
  if (env.DEMO_MODE) {
    users.rows = users.rows.map((u) => ({ ...u.toJSON(), email: maskEmail(u.email), parentEmail: maskEmail(u.parentEmail) }));
  }
  res.json(users);
});

module.exports = router;
