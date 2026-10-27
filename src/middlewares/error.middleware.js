const HTTP_STATUS = require('../constants/httpStatusCodes');
const envConfig = require('../config/env.config');
const AppError = require('../utils/AppError');

/**
 * Handle Mongoose CastError (e.g. invalid ObjectId format)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: '${err.value}'. Expected a valid format.`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST, [
    { field: err.path, message: `Invalid format for '${err.value}'` },
  ]);
};

/**
 * Handle Mongoose duplicate key errors (code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value for '${field}': '${value}'. An account with this ${field} already exists.`;
  return new AppError(message, HTTP_STATUS.CONFLICT, [
    { field, message: `${field} '${value}' is already taken.` },
  ]);
};

/**
 * Handle Mongoose schema validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  return new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors);
};

/**
 * Handle Zod validation errors
 */
const handleZodError = (err) => {
  const issues = err.issues || [];
  const errors = issues.map((issue) => ({
    field: issue.path.join('.') || 'field',
    message: issue.message,
  }));
  return new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors);
};

/**
 * Handle JWT invalid signature
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please authenticate.', HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Handle JWT expiration
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Centralized global error handling middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error occurred';
  let errors = err.errors || null;

  // Handle specific database and runtime exceptions
  if (err.name === 'CastError') {
    const customErr = handleCastErrorDB(err);
    statusCode = customErr.statusCode;
    message = customErr.message;
    errors = customErr.errors;
  } else if (err.code === 11000) {
    const customErr = handleDuplicateFieldsDB(err);
    statusCode = customErr.statusCode;
    message = customErr.message;
    errors = customErr.errors;
  } else if (err.name === 'ValidationError') {
    const customErr = handleValidationErrorDB(err);
    statusCode = customErr.statusCode;
    message = customErr.message;
    errors = customErr.errors;
  } else if (err.name === 'ZodError') {
    const customErr = handleZodError(err);
    statusCode = customErr.statusCode;
    message = customErr.message;
    errors = customErr.errors;
  } else if (err.name === 'JsonWebTokenError') {
    const customErr = handleJWTError();
    statusCode = customErr.statusCode;
    message = customErr.message;
  } else if (err.name === 'TokenExpiredError') {
    const customErr = handleJWTExpiredError();
    statusCode = customErr.statusCode;
    message = customErr.message;
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Malformed JSON payload in request body.';
  }

  const responsePayload = {
    success: false,
    message,
  };

  if (errors) {
    responsePayload.errors = errors;
  }

  // Include stack trace only in development mode for unhandled server errors
  if (envConfig.isDevelopment && statusCode >= 500) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
