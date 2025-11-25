/**
 * Global Error Handler Middleware
 * Catches and formats all application errors
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Default error response
  let error = {
    error: true,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Handle different error types
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.details = err.details;
    return res.status(400).json(error);
  }

  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    return res.status(400).json(error);
  }

  if (err.code === 'ENOENT') {
    error.message = 'File not found';
    return res.status(404).json(error);
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value';
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  // API specific errors
  if (err.message.includes('API')) {
    error.message = 'External API error - using fallback';
    error.details = err.message;
    return res.status(503).json(error);
  }

  // File operation errors
  if (err.message.includes('EACCES')) {
    error.message = 'Permission denied';
    return res.status(403).json(error);
  }

  // Network errors
  if (err.code === 'ECONNREFUSED') {
    error.message = 'Service unavailable';
    return res.status(503).json(error);
  }

  // Production vs Development error handling
  if (process.env.NODE_ENV === 'production') {
    // Don't leak error details in production
    error.message = 'Something went wrong';
    delete error.stack;
  } else {
    // Include stack trace in development
    error.stack = err.stack;
    error.details = err;
  }

  // Default 500 error
  res.status(500).json(error);
};

module.exports = errorHandler;