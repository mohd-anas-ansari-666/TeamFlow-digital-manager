import { query } from '../config/database';
import { Project, ProjectStatus } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getProjects = async (teamId?: string): Promise<Project[]> => {
  let sql = `
    SELECT id, name, description, team_id, status, progress, due_date,
           task_count, completed_task_count, created_at, updated_at
    FROM projects
  `;
  const params: any[] = [];

  if (teamId) {
    sql += ' WHERE team_id = $1';
    params.push(teamId);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows.map(mapProjectFromDb);
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const result = await query(
    `SELECT id, name, description, team_id, status, progress, due_date,
            task_count, completed_task_count, created_at, updated_at
     FROM projects WHERE id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Project not found');
  }

  return mapProjectFromDb(result.rows[0]);
};

export const createProject = async (data: {
  name: string;
  description?: string;
  teamId: string;
  status?: ProjectStatus;
  dueDate?: string;
}): Promise<Project> => {
  const { name, description, teamId, status = 'active', dueDate } = data;

  const result = await query(
    `INSERT INTO projects (name, description, team_id, status, due_date, progress, task_count, completed_task_count)
     VALUES ($1, $2, $3, $4, $5, 0, 0, 0)
     RETURNING id, name, description, team_id, status, progress, due_date,
               task_count, completed_task_count, created_at, updated_at`,
    [name, description, teamId, status, dueDate]
  );

  return mapProjectFromDb(result.rows[0]);
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'dueDate'>>
): Promise<Project> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.status) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }
  if (updates.dueDate !== undefined) {
    fields.push(`due_date = $${paramCount++}`);
    values.push(updates.dueDate);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  values.push(projectId);

  const result = await query(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, name, description, team_id, status, progress, due_date,
               task_count, completed_task_count, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Project not found');
  }

  return mapProjectFromDb(result.rows[0]);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const result = await query('DELETE FROM projects WHERE id = $1', [projectId]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'Project not found');
  }
};

const mapProjectFromDb = (row: any): Project => ({
  id: row.id,
  name: row.name,
  description: row.description,
  teamId: row.team_id,
  status: row.status,
  progress: row.progress,
  dueDate: row.due_date,
  taskCount: row.task_count,
  completedTaskCount: row.completed_task_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});