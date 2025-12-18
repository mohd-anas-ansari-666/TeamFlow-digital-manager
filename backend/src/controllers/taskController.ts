import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as taskService from '../services/taskService';

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query;
    const tasks = await taskService.getTasks(projectId as string);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const task = await taskService.updateTaskStatus(req.params.id, status);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await taskService.deleteTask(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};