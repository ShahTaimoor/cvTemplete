/**
 * Wraps an async Express route handler so a rejected promise is forwarded to
 * next(err) instead of becoming an unhandled rejection. Express 4 does not
 * await route handlers or catch what they throw/reject with — without this,
 * any error inside an `async (req, res) => {...}` handler (e.g. a Mongoose
 * CastError from a malformed :id) crashes the whole process instead of
 * producing an error response.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
