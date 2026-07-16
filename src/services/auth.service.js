const bcrypt = require('bcryptjs');
const UserRepository = require('../repository/user.repository');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { setCache, getCache, delCache } = require('../config/redis');
const logger = require('../config/logger');

const SALT_ROUNDS = 12;
const CACHE_PREFIX = 'user:';

class AuthService {
  /**
   * Register a new user
   * @param {Object} data — { name, email, password }
   * @returns {Object} { user, accessToken, refreshToken }
   */
  async register(data) {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await UserRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword
    });

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Cache user
    await setCache(`${CACHE_PREFIX}${user.id}`, user.toJSON(), 3600);

    logger.info(`User registered: ${user.email}`);
    return { user: user.toJSON(), accessToken, refreshToken };
  }

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Object}
   */
  async login(email, password) {
    const user = await UserRepository.findByEmail(email, true);
    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Strip password before returning
    const safeUser = user.toJSON();
    delete safeUser.password;

    await setCache(`${CACHE_PREFIX}${user.id}`, safeUser, 3600);

    logger.info(`User logged in: ${user.email}`);
    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Get current user profile with cache
   * @param {string} userId
   * @returns {Object}
   */
  async getProfile(userId) {
    // Try cache first
    const cached = await getCache(`${CACHE_PREFIX}${userId}`);
    if (cached) return cached;

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const userData = user.toJSON();
    await setCache(`${CACHE_PREFIX}${userId}`, userData, 3600);
    return userData;
  }
}

module.exports = new AuthService();
