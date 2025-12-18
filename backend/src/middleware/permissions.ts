import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { query } from '../config/database';

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const teamId = req.params.teamId || req.body.teamId;
  
  if (!teamId) {
    return res.status(400).json({ error: 'Team ID required' });
  }

  try {
    const result = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireProjectAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const projectId = req.params.projectId || req.params.id || req.body.projectId;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  try {
    const result = await query(
      `SELECT p.id FROM projects p
       INNER JOIN team_members tm ON p.team_id = tm.team_id
       WHERE p.id = $1 AND tm.user_id = $2`,
      [projectId, req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this project' });
    }

    next();
  } catch (error) {
    next(error);
  }
};