const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string().email().required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'any.required': 'Password is required',
      'string.pattern.base': 'Password must contain uppercase, lowercase & number'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string().required()
    .messages({ 'any.required': 'Password is required' })
});

module.exports = { registerSchema, loginSchema };
