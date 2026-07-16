const { error } = require('../utils/response');

/**
 * Validates request body against a Joi schema
 * @param {import('joi').Schema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error: validationError, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const messages = validationError.details.map((d) => d.message);
      return res.status(400).json(error('Validation failed', messages));
    }

    req.body = value;
    next();
  };
}

module.exports = { validate };
