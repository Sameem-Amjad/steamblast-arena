const { Sequelize } = require('sequelize');
const { URL } = require('url');
const env = require('./env');

const dbUrl = new URL(env.DATABASE_URL);

const sequelize = new Sequelize({
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

module.exports = sequelize;
