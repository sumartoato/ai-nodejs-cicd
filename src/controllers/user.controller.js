const UserRepository = require('../repository/user.repository');
const AuthService = require('../services/auth.service');
const { success, error } = require('../utils/response');

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
async function getProfile(req, res, next) {
  try {
    const user = await AuthService.getProfile(req.user.id);
    res.json(success(user));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(error(err.message));
    }
    next(err);
  }
}

/**
 * GET /api/v1/users
 * List all users (admin only)
 */
async function getAll(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await UserRepository.findAll(page, limit);
    res.json(success(result.users, 'Users retrieved', { total: result.total, page, limit }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/users/:id
 * Get user by ID (admin only)
 */
async function getById(req, res, next) {
  try {
    const user = await UserRepository.findById(req.params.id);
    if (!user) {
      return res.status(404).json(error('User not found'));
    }
    res.json(success(user));
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getAll, getById };
