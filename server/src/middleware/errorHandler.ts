import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error
  logger.error('Error:', {
    message,
    statusCode,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
