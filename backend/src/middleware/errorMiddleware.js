/**
 * 404 NOT FOUND MIDDLEWARE
 * Catches any request to routes that do not exist.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * GLOBAL ERROR HANDLER
 * Catches all errors thrown in controllers (e.g., Database errors, Logic errors)
 */
const errorHandler = (err, req, res, next) => {
  // Sometimes errors come with a 200 status; we force it to 500 if so
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);

  res.json({
    message: err.message,
    // Security: Only show the stack trace in development mode
    // In production, we hide the stack to prevent information leakage
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };