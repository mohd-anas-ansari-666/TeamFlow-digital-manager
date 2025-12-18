import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as insightService from '../services/insightService';

export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query;
    const insights = await insightService.getInsights(projectId as string);
    res.json(insights);
  } catch (error) {
    next(error);
  }
};

export const createInsight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const insight = await insightService.createInsight(req.body);
    res.status(201).json(insight);
  } catch (error) {
    next(error);
  }
};

export const generateInsights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const insights = await insightService.generateInsightsForProject(projectId);
    res.json(insights);
  } catch (error) {
    next(error);
  }
};

export const deleteInsight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await insightService.deleteInsight(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};