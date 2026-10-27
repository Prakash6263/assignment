/**
 * Custom Operational Application Error class
 * Extends the native Error class with HTTP status code and operational flag.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code
   * @param {Array|Object} [errors=null] - Additional validation or detail errors
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
