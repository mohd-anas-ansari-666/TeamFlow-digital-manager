import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/userService';

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getCurrentUser(req.user!.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUser(req.user!.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};