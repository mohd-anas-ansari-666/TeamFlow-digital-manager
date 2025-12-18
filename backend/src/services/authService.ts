import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { User, LoginCredentials, RegisterData } from '../types';
import { AppError } from '../middleware/errorHandler';
import config from '../config/env';
import { validateEmail, validatePassword } from '../middleware/validation';
import { generateToken } from '../middleware/auth';

export const register = async (data: RegisterData): Promise<{ user: User; token: string }> => {
  const { name, email, password, role = 'member' } = data;

  if (!validateEmail(email)) {
    throw new AppError(400, 'Invalid email format');
  }

  if (!validatePassword(password)) {
    throw new AppError(400, 'Password must be at least 8 characters');
  }

  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, avatar, role, created_at, updated_at`,
    [name, email, passwordHash, role]
  );

  const user = result.rows[0];
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return { user: mapUserFromDb(user), token };
};

export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const { email, password } = credentials;

  if (!validateEmail(email)) {
    throw new AppError(400, 'Invalid email format');
  }

  const result = await query(
    'SELECT id, name, email, password_hash, avatar, role, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError(401, 'Invalid credentials');
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return { user: mapUserFromDb(user), token };
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