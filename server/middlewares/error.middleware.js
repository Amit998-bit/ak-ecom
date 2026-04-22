import { ApiError } from '../utils/ApiError.util.js';

export const errorHandler = (err, req, res, next) => {
  let error   = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(404, 'Resource not found');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field   = Object.keys(err.keyPattern)[0];
    error = new ApiError(400, field + ' already exists');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join(', '));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError')  error = new ApiError(401, 'Token expired');

  res.status(error.statusCode || 500).json({
    success: false,
    error:   error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  next(new ApiError(404, 'Not Found - ' + req.originalUrl));
};
