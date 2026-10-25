const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findByPk(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    User.findByPk(payload.userId).then((user) => {
      req.user = user;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

function issueToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

module.exports = { authenticate, requireRole, optionalAuth, issueToken };
