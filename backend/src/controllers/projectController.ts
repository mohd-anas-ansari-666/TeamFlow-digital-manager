import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as projectService from '../services/projectService';

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.query;
    const projects = await projectService.getProjects(teamId as string);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};