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
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  // Handle specific database and runtime exceptions
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload in request body.', HTTP_STATUS.BAD_REQUEST);
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'Internal server error occurred';

  const responsePayload = {
    success: false,
    message,
  };

  if (error.errors) {
    responsePayload.errors = error.errors;
  }

  // Include stack trace only in development mode for debugging
  if (envConfig.isDevelopment) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
