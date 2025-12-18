import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal server error',
    ...(config.NODE_ENV === 'development' && { 
      message: err.message,
      stack: err.stack 
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
};