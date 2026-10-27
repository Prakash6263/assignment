const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Higher-order middleware to validate incoming request parts (body, query, params)
 * using declarative Zod schemas.
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Target request property
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace with sanitized & typed data from Zod
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.') || source,
          message: e.message,
        }));

        return next(
          new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, formattedErrors)
        );
      }
      next(err);
    }
  };
};

module.exports = validate;
