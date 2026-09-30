// 404 handler for unmatched routes.
export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler. Never leaks stack traces to the client, even
// though it logs them server-side for debugging.
export function errorHandler(err, req, res, _next) {
  console.error(err);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Something went wrong. Please try again.";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format.";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already in use.`;
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
