const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const envConfig = require('../config/env.config');
const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');

/**
 * Authentication Middleware
 * Verifies Bearer JWT, validates token expiration/signature, and attaches authenticated user to `req.user`.
 */
const authenticate = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'Authentication required. Please provide a valid Bearer token in the Authorization header.',
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, envConfig.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED));
    }
    return next(new AppError('Invalid authentication token.', HTTP_STATUS.UNAUTHORIZED));
  }

  // 3. Check if user still exists in DB
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', HTTP_STATUS.UNAUTHORIZED)
    );
  }

  // 4. Grant access: attach user to request object
  req.user = currentUser;
  next();
});

module.exports = {
  authenticate,
};
