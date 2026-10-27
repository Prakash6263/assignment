const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Standardized API Response Helper for consistent contract across all endpoints
 */
class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {string} message - Human-readable success message
   * @param {*} [data=null] - Payload to return
   * @param {Object} [meta=null] - Pagination / additional metadata
   */
  static success(res, statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = null) {
    const responsePayload = {
      success: true,
      message,
      data,
    };

    if (meta) {
      responsePayload.meta = meta;
    }

    return res.status(statusCode).json(responsePayload);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {*} [errors=null] - Validation error list or extra context
   */
  static error(res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'Internal Server Error', errors = null) {
    const responsePayload = {
      success: false,
      message,
    };

    if (errors) {
      responsePayload.errors = errors;
    }

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;
