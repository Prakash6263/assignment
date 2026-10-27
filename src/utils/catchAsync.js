/**
 * Catches asynchronous errors and passes them to the next error handling middleware.
 * Eliminates repetitive try-catch blocks in controllers.
 * 
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
