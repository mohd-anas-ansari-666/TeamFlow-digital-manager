import { query } from '../config/database';
import { Task, TaskStatus, TaskPriority } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getTasks = async (projectId?: string): Promise<Task[]> => {
  let sql = `
    SELECT t.id, t.title, t.description, t.project_id, t.assignee_id, t.status,
           t.priority, t.due_date, t.is_overdue, t.tags, t.created_at, t.updated_at,
           u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at as user_created_at
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
  `;
  const params: any[] = [];

  if (projectId) {
    sql += ' WHERE t.project_id = $1';
    params.push(projectId);
  }

  sql += ' ORDER BY t.created_at DESC';

  const result = await query(sql, params);
  return result.rows.map(mapTaskFromDb);
};

export const getTaskById = async (taskId: string): Promise<Task> => {
  const result = await query(
    `SELECT t.id, t.title, t.description, t.project_id, t.assignee_id, t.status,
            t.priority, t.due_date, t.is_overdue, t.tags, t.created_at, t.updated_at,
            u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at as user_created_at
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.id = $1`,
    [taskId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Task not found');
  }

  return mapTaskFromDb(result.rows[0]);
};

export const createTask = async (data: {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
}): Promise<Task> => {
  const {
    title,
    description,
    projectId,
    assigneeId,
    status = 'backlog',
    priority = 'medium',
    dueDate,
    tags = [],
  } = data;

  const result = await query(
    `INSERT INTO tasks (title, description, project_id, assignee_id, status, priority, due_date, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, description, project_id, assignee_id, status, priority,
               due_date, is_overdue, tags, created_at, updated_at`,
    [title, description, projectId, assigneeId, status, priority, dueDate, tags]
  );

  const task = result.rows[0];

  if (task.assignee_id) {
    const userResult = await query(
      'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = $1',
      [task.assignee_id]
    );
    if (userResult.rows.length > 0) {
      task.assignee = userResult.rows[0];
    }
  }

  return mapTaskFromDb(task);
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue'>>
): Promise<Task> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.title) {
    fields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.assigneeId !== undefined) {
    fields.push(`assignee_id = $${paramCount++}`);
    values.push(updates.assigneeId);
  }
  if (updates.status) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }
  if (updates.priority) {
    fields.push(`priority = $${paramCount++}`);
    values.push(updates.priority);
  }
  if (updates.dueDate !== undefined) {
    fields.push(`due_date = $${paramCount++}`);
    values.push(updates.dueDate);
  }
  if (updates.tags !== undefined) {
    fields.push(`tags = $${paramCount++}`);
    values.push(updates.tags);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  values.push(taskId);

  const result = await query(
    `UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, title, description, project_id, assignee_id, status, priority,
               due_date, is_overdue, tags, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Task not found');
  }

  const task = result.rows[0];

  if (task.assignee_id) {
    const userResult = await query(
      'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = $1',
      [task.assignee_id]
    );
    if (userResult.rows.length > 0) {
      task.assignee = userResult.rows[0];
    }
  }

  return mapTaskFromDb(task);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task> => {
  return updateTask(taskId, { status });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const result = await query('DELETE FROM tasks WHERE id = $1', [taskId]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'Task not found');
  }
};

const mapTaskFromDb = (row: any): Task => {
  const task: Task = {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    assigneeId: row.assignee_id,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    isOverdue: row.is_overdue,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.user_id) {
    task.assignee = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role,
      createdAt: row.user_created_at,
      updatedAt: row.user_created_at,
    };
  }

  return task;
};