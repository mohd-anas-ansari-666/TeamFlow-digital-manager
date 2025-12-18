import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as workloadService from '../services/workloadService';

export const getDashboardMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const metrics = await workloadService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

export const getTeamWorkload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const workload = await workloadService.getTeamWorkload(teamId);
    res.json(workload);
  } catch (error) {
    next(error);
  }
};