const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * 404 Route Not Found middleware
 */
const notFoundHandler = (req, res, next) => {
  next(
    new AppError(
      `Cannot find endpoint '${req.method} ${req.originalUrl}' on this server.`,
      HTTP_STATUS.NOT_FOUND
    )
  );
};

module.exports = notFoundHandler;
