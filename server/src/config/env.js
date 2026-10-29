require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// Demo mode runs the whole game on an in-memory database that is rebuilt and reseeded on every
// start, fills matches with bots and switches off payments and email.
const DEMO_MODE = process.env.DEMO_MODE === 'true';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  DEMO_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  SQLITE_STORAGE: process.env.SQLITE_STORAGE || ':memory:',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  STRIPE_SECRET_KEY: DEMO_MODE ? undefined : process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID_PREMIUM: process.env.STRIPE_PRICE_ID_PREMIUM,
  SENDGRID_API_KEY: DEMO_MODE ? undefined : process.env.SENDGRID_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@steamblastgame.com',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5174',
  PREMIUM_PRICE_HKD: parseInt(process.env.PREMIUM_PRICE_HKD, 10) || 2000,
  // Seconds a lone player waits before bots fill the match (0 = never).
  BOT_FILL_SECONDS: process.env.BOT_FILL_SECONDS !== undefined
    ? parseFloat(process.env.BOT_FILL_SECONDS) || 0
    : (DEMO_MODE ? 3 : 0),
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
};

if (env.isProd && env.JWT_SECRET === 'dev_secret_change_in_production') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
