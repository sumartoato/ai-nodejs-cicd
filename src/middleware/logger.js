const morgan = require('morgan');
const logger = require('../config/logger');

/**
 * HTTP request logger using Morgan + Winston
 */
const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: logger.stream,
    skip: (req) => req.url === '/health'
  }
);

module.exports = httpLogger;
