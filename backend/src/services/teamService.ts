import { query } from '../config/database';
import { Team, TeamMember, User } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getTeams = async (userId: string): Promise<Team[]> => {
  const result = await query(
    `SELECT DISTINCT t.id, t.name, t.description, t.owner_id, t.created_at, t.updated_at
     FROM teams t
     INNER JOIN team_members tm ON t.id = tm.team_id
     WHERE tm.user_id = $1
     ORDER BY t.name`,
    [userId]
  );

  const teams = result.rows.map(mapTeamFromDb);

  for (const team of teams) {
    team.members = await getTeamMembers(team.id);
  }

  return teams;
};

export const getTeamById = async (teamId: string): Promise<Team> => {
  const result = await query(
    'SELECT id, name, description, owner_id, created_at, updated_at FROM teams WHERE id = $1',
    [teamId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Team not found');
  }

  const team = mapTeamFromDb(result.rows[0]);
  team.members = await getTeamMembers(teamId);

  return team;
};

export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  const result = await query(
    `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at,
            u.id as user_id, u.name, u.email, u.avatar, u.role as user_role, u.created_at as user_created_at
     FROM team_members tm
     INNER JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = $1
     ORDER BY u.name`,
    [teamId]
  );

  return result.rows.map(row => ({
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    user: {
      id: row.user_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.user_role,
      createdAt: row.user_created_at,
      updatedAt: row.user_created_at,
    },
  }));
};

export const createTeam = async (
  name: string,
  description: string | undefined,
  ownerId: string
): Promise<Team> => {
  const client = await query('BEGIN', []);

  try {
    const teamResult = await query(
      `INSERT INTO teams (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, owner_id, created_at, updated_at`,
      [name, description, ownerId]
    );

    const team = teamResult.rows[0];

    await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [team.id, ownerId, 'owner']
    );

    await query('COMMIT', []);

    return mapTeamFromDb(team);
  } catch (error) {
    await query('ROLLBACK', []);
    throw error;
  }
};

export const addTeamMember = async (
  teamId: string,
  userId: string,
  role: string = 'member'
): Promise<TeamMember> => {
  const result = await query(
    `INSERT INTO team_members (team_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (team_id, user_id) DO NOTHING
     RETURNING id, team_id, user_id, role, joined_at`,
    [teamId, userId, role]
  );

  if (result.rows.length === 0) {
    throw new AppError(409, 'User is already a team member');
  }

  return {
    id: result.rows[0].id,
    teamId: result.rows[0].team_id,
    userId: result.rows[0].user_id,
    role: result.rows[0].role,
    joinedAt: result.rows[0].joined_at,
  };
};

const mapTeamFromDb = (row: any): Team => ({
  id: row.id,
  name: row.name,
  description: row.description,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});