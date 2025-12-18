import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      throw new AppError(
        400,
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }
    
    next();
  };
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};