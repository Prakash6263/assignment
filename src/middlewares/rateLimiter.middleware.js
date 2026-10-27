const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

/**
 * Rate limiter specifically for login attempts to prevent brute-force attacks
 * Limits each IP to 5 requests per 15-minute window
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      429,
      'Too many login attempts from this IP address. Please try again after 15 minutes.'
    );
  },
});

/**
 * General API rate limiter
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      429,
      'Too many requests from this IP. Please try again later.'
    );
  },
});

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
};
