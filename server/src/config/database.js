const { Sequelize } = require('sequelize');
const { URL } = require('url');
const env = require('./env');

function createSequelize() {
  if (env.DEMO_MODE) {
    return new Sequelize({ dialect: 'sqlite', storage: env.SQLITE_STORAGE, logging: false });
  }

  const dbUrl = new URL(env.DATABASE_URL);
  return new Sequelize({
    dialect: 'postgres',
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port, 10),
    database: dbUrl.pathname.slice(1),
    username: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    logging: env.isDev ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  });
}

module.exports = createSequelize();
