const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Role-Based Access Control (RBAC) middleware
 * Restricts access to users with specified roles
 * 
 * @param  {...string} allowedRoles - Array of allowed roles (e.g. 'ADMIN', 'USER')
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required to verify permissions.', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: You do not have permission to perform this action. Required role: ${allowedRoles.join(' or ')}.`,
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    next();
  };
};

module.exports = {
  authorize,
};
