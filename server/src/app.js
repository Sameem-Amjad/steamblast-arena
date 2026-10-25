const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');
const shopRoutes = require('./routes/shop');
const leaderboardRoutes = require('./routes/leaderboard');
const teacherRoutes = require('./routes/teacher');
const paymentRoutes = require('./routes/payments');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [env.CLIENT_URL, env.ADMIN_URL],
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
