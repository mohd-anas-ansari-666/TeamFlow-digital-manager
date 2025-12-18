import { query } from '../config/database';
import { Standup } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getStandups = async (teamId: string, date?: string): Promise<Standup[]> => {
  let sql = `
    SELECT s.id, s.user_id, s.team_id, s.date, s.yesterday, s.today, s.blockers, s.created_at,
           u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at as user_created_at
    FROM standups s
    INNER JOIN users u ON s.user_id = u.id
    WHERE s.team_id = $1
  `;
  const params: any[] = [teamId];

  if (date) {
    sql += ' AND s.date = $2';
    params.push(date);
  }

  sql += ' ORDER BY s.created_at DESC';

  const result = await query(sql, params);
  return result.rows.map(mapStandupFromDb);
};

export const getStandupById = async (standupId: string): Promise<Standup> => {
  const result = await query(
    `SELECT s.id, s.user_id, s.team_id, s.date, s.yesterday, s.today, s.blockers, s.created_at,
            u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at as user_created_at
     FROM standups s
     INNER JOIN users u ON s.user_id = u.id
     WHERE s.id = $1`,
    [standupId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Standup not found');
  }

  return mapStandupFromDb(result.rows[0]);
};

export const submitStandup = async (data: {
  userId: string;
  teamId: string;
  date: string;
  yesterday: string;
  today: string;
  blockers?: string;
}): Promise<Standup> => {
  const { userId, teamId, date, yesterday, today, blockers } = data;

  const result = await query(
    `INSERT INTO standups (user_id, team_id, date, yesterday, today, blockers)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, team_id, date) 
     DO UPDATE SET yesterday = $4, today = $5, blockers = $6, created_at = CURRENT_TIMESTAMP
     RETURNING id, user_id, team_id, date, yesterday, today, blockers, created_at`,
    [userId, teamId, date, yesterday, today, blockers]
  );

  const standup = result.rows[0];

  const userResult = await query(
    'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length > 0) {
    standup.user = userResult.rows[0];
  }

  return mapStandupFromDb(standup);
};

export const getUserStandupForDate = async (
  userId: string,
  teamId: string,
  date: string
): Promise<Standup | null> => {
  const result = await query(
    `SELECT s.id, s.user_id, s.team_id, s.date, s.yesterday, s.today, s.blockers, s.created_at,
            u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at as user_created_at
     FROM standups s
     INNER JOIN users u ON s.user_id = u.id
     WHERE s.user_id = $1 AND s.team_id = $2 AND s.date = $3`,
    [userId, teamId, date]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapStandupFromDb(result.rows[0]);
};

const mapStandupFromDb = (row: any): Standup => {
  const standup: Standup = {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    date: row.date,
    yesterday: row.yesterday,
    today: row.today,
    blockers: row.blockers,
    createdAt: row.created_at,
  };

  if (row.name) {
    standup.user = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role,
      createdAt: row.user_created_at,
      updatedAt: row.user_created_at,
    };
  }

  return standup;
};