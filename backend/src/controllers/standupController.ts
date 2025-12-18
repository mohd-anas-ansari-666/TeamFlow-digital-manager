import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as standupService from '../services/standupService';

export const getStandups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, date } = req.query;
    const standups = await standupService.getStandups(teamId as string, date as string);
    res.json(standups);
  } catch (error) {
    next(error);
  }
};

export const getStandupById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const standup = await standupService.getStandupById(req.params.id);
    res.json(standup);
  } catch (error) {
    next(error);
  }
};

export const submitStandup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, date, yesterday, today, blockers } = req.body;
    const standup = await standupService.submitStandup({
      userId: req.user!.id,
      teamId,
      date,
      yesterday,
      today,
      blockers,
    });
    res.status(201).json(standup);
  } catch (error) {
    next(error);
  }
};