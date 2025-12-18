import { query } from '../config/database';
import { User } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getCurrentUser = async (userId: string): Promise<User> => {
  const result = await query(
    'SELECT id, name, email, avatar, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  return mapUserFromDb(result.rows[0]);
};

export const getUserById = async (userId: string): Promise<User> => {
  const result = await query(
    'SELECT id, name, email, avatar, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  return mapUserFromDb(result.rows[0]);
};

export const getAllUsers = async (): Promise<User[]> => {
  const result = await query(
    'SELECT id, name, email, avatar, role, created_at, updated_at FROM users ORDER BY name'
  );

  return result.rows.map(mapUserFromDb);
};

export const updateUser = async (
  userId: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>>
): Promise<User> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.email) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }
  if (updates.avatar !== undefined) {
    fields.push(`avatar = $${paramCount++}`);
    values.push(updates.avatar);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  values.push(userId);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, name, email, avatar, role, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  return mapUserFromDb(result.rows[0]);
};

const mapUserFromDb = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  avatar: row.avatar,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});