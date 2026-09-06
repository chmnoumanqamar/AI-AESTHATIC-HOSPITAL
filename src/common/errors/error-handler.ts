import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}] ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      details: err.details
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn(`ValidationError on ${req.method} ${req.path}`, { issues: err.issues });
    const formattedIssues = err.issues.map(i => `${i.path.join('.') || 'field'}: ${i.message}`).join('; ');
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid input parameters: ${formattedIssues}`,
        details: err.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }))
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  logger.error('Unhandled System Exception:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected system error occurred'
    },
    timestamp: new Date().toISOString()
  });
};
