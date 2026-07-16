require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const { testConnection, syncModels } = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 3001;

async function start() {
  // Test DB connection
  const dbOk = await testConnection();
  if (!dbOk) {
    logger.warn('Starting without database — some features will be unavailable');
  } else {
    await syncModels();
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API docs:    http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
