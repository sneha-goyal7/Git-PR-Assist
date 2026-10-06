/**
 * Global Express error handling middleware.
 * Catches unhandled errors, logs them with a timestamp, and returns
 * a structured JSON response with appropriate HTTP status codes.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const timestamp = new Date().toISOString();
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with timestamp for debugging
  console.error(`[${timestamp}] ERROR ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    code: statusCode,
  });
}

module.exports = errorHandler;
