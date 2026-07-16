const AuthService = require('../services/auth.service');
const { success, error } = require('../utils/response');

/**
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(success(result, 'Registration successful'));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(error(err.message));
    }
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(success(result, 'Login successful'));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(error(err.message));
    }
    next(err);
  }
}

module.exports = { register, login };
