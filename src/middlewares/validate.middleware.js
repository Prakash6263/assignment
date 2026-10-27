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
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues = result.error.issues || [];
      const formattedErrors = issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));

      return next(
        new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, formattedErrors)
      );
    }

    // Replace with sanitized & typed data from Zod
    req[source] = result.data;
    next();
  };
};

module.exports = validate;
