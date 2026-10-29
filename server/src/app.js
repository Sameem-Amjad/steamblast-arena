const fs = require('fs');
const path = require('path');
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
const { DEMO_ACCOUNTS } = require('./demo/accounts');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Served over HTTPS in production anyway; upgrading breaks plain-http local runs.
      upgradeInsecureRequests: null,
    },
  },
}));
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

app.get('/api/config', (req, res) => {
  res.json({
    demoMode: env.DEMO_MODE,
    paymentsEnabled: Boolean(env.STRIPE_SECRET_KEY),
    botFillSeconds: env.BOT_FILL_SECONDS,
    demoAccounts: env.DEMO_MODE ? DEMO_ACCOUNTS : [],
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

if (env.DEMO_MODE) {
  app.get('/robots.txt', (req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /\n'));
}

// When the client and admin builds sit next to the server (one-service deploys), serve them too.
const clientDist = path.resolve(__dirname, '../../client/dist');
const adminDist = path.resolve(__dirname, '../../admin/dist');

if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));
}

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    setHeaders: (res, file) => {
      if (file.endsWith('sw.js') || file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
