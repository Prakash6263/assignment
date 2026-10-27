const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const { ROLE_VALUES } = require('../constants/roles');

/**
 * Zod Schema for User Registration
 */
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  role: z
    .enum(ROLE_VALUES, {
      errorMap: () => ({ message: `Role must be one of: ${ROLE_VALUES.join(', ')}` }),
    })
    .optional(),
});

/**
 * Zod Schema for User Login
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Zod Schema for Refresh Token
 */
const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token cannot be empty'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validateRegister: validate(registerSchema, 'body'),
  validateLogin: validate(loginSchema, 'body'),
  validateRefreshToken: validate(refreshTokenSchema, 'body'),
};
