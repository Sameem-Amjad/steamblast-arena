process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/database');
const redis = require('./config/redis');
const registerSocketHandlers = require('./sockets');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [env.CLIENT_URL, env.ADMIN_URL],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

async function start() {
  try {
    await redis.connect();
    console.log('Redis connected');

    await sequelize.authenticate();
    console.log('PostgreSQL connected');

    if (env.isDev) {
      await sequelize.sync({ alter: false });
    }

    server.listen(env.PORT, () => {
      console.log(`SteamBlast server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
