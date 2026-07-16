/**
 * Standard API response helpers
 */

/**
 * Success response
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
function success(data = null, message = 'Success', statusCode = 200) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Error response
 * @param {string} message
 * @param {Array} errors
 * @param {number} statusCode
 */
function error(message = 'Internal Server Error', errors = [], statusCode = 500) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  if (errors.length > 0) response.errors = errors;
  return response;
}

/**
 * Pagination response
 * @param {Array} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
function paginated(data, total, page, limit) {
  return {
    success: true,
    message: 'Success',
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = { success, error, paginated };
