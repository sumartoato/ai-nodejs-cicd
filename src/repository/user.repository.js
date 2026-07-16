const User = require('../models/User');

class UserRepository {
  /**
   * Find user by ID (excludes password by default)
   */
  async findById(id) {
    return User.findByPk(id);
  }

  /**
   * Find user by email
   */
  async findByEmail(email, includePassword = false) {
    if (includePassword) {
      return User.scope('withPassword').findOne({ where: { email } });
    }
    return User.findOne({ where: { email } });
  }

  /**
   * Create a new user
   */
  async create(data) {
    return User.create(data);
  }

  /**
   * Get all users with pagination
   */
  async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return { users: rows, total: count };
  }

  /**
   * Update user by ID
   */
  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  }

  /**
   * Delete user by ID (soft)
   */
  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }
}

module.exports = new UserRepository();
