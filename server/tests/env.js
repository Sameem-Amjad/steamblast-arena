// Tests run against the in-memory demo database, never a real one.
process.env.DEMO_MODE = 'true';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = '';
process.env.STRIPE_SECRET_KEY = '';
process.env.SENDGRID_API_KEY = '';
process.env.BOT_FILL_SECONDS = '0.05';
