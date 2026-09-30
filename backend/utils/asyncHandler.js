// Wraps an async route handler so rejected promises are forwarded to
// Express's error handler instead of crashing the process or hanging.
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
