import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
};