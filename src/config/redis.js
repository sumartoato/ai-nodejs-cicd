const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err.message);
});

/**
 * Set a key with TTL
 * @param {string} key
 * @param {*} value
 * @param {number} ttlSeconds
 */
async function setCache(key, value, ttlSeconds = 3600) {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn('Redis setCache error:', err.message);
  }
}

/**
 * Get a cached value
 * @param {string} key
 * @returns {*|null}
 */
async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn('Redis getCache error:', err.message);
    return null;
  }
}

/**
 * Delete a cached key
 * @param {string} key
 */
async function delCache(key) {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn('Redis delCache error:', err.message);
  }
}

module.exports = { redis, setCache, getCache, delCache };
