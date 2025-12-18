import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as teamService from '../services/teamService';

export const getTeams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teams = await teamService.getTeams(req.user!.id);
    res.json(teams);
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

export const getTeamMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const members = await teamService.getTeamMembers(req.params.teamId);
    res.json(members);
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const team = await teamService.createTeam(name, description, req.user!.id);
    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { userId, role } = req.body;
    const member = await teamService.addTeamMember(teamId, userId, role);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};