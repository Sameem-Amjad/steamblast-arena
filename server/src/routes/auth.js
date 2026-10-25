const express = require('express');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const Filter = require('bad-words');
const { User, Subscription } = require('../models');
const { authenticate, issueToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const filter = new Filter();

router.post('/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('displayName').trim().isLength({ min: 2, max: 32 }),
    body('role').optional().isIn(['student', 'teacher']),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, displayName, role, parentEmail } = req.body;

      if (filter.isProfane(displayName)) {
        return res.status(422).json({ error: 'Display name contains inappropriate content.' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const user = await User.create({
        email,
        passwordHash: password,
        displayName,
        role: role || 'student',
        parentEmail: parentEmail || null,
      });

      const token = issueToken(user.id);
      res.status(201).json({ token, user: user.toPublic() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({
        where: { email },
        include: [{ association: 'subscription' }],
      });
      if (!user || !(await user.checkPassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      await user.update({ lastLoginAt: new Date() });
      const token = issueToken(user.id);
      res.json({ token, user: user.toPublic() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/guest', async (req, res) => {
  try {
    const guestName = `Player_${Math.floor(Math.random() * 9000 + 1000)}`;
    const user = await User.create({
      displayName: guestName,
      isGuest: true,
    });
    const token = issueToken(user.id);
    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!(await req.user.checkPassword(currentPassword))) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
      await req.user.update({ passwordHash: newPassword });
      res.json({ message: 'Password updated.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
