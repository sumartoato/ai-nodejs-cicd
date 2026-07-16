const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'nodejs_cicd',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (err) {
    logger.error('Unable to connect to database:', err.message);
    return false;
  }
}

/**
 * Sync all models (for dev/staging — use migrations in production)
 */
async function syncModels() {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    logger.info('Database models synced');
  } catch (err) {
    logger.error('Failed to sync models:', err.message);
  }
}

module.exports = { sequelize, testConnection, syncModels };
