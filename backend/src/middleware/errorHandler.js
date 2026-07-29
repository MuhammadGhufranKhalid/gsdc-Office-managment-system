import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) =>
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));


export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  if (err.name === 'CastError') error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for '${field}'.`);
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', details);
  }
  if (err.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token.');
  if (err.name === 'TokenExpiredError') error = ApiError.unauthorized('Token expired.');

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || 'Internal server error',
  };
  if (error.details) payload.details = error.details;
  if (env.nodeEnv === 'development' && statusCode === 500) payload.stack = err.stack;

  res.status(statusCode).json(payload);
};
