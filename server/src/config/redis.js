const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

module.exports = redis;
