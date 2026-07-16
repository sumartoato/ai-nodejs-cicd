const { verifyToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

/**
 * Authenticate JWT token from Authorization header
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error('Access denied. No token provided'));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json(error('Invalid or expired token'));
  }

  req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
  next();
}

/**
 * Authorize by role(s)
 * @param  {...string} roles — allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(error('Forbidden: insufficient permissions'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
