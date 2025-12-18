import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { AuthRequest } from '../types';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as any,
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const generateToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};