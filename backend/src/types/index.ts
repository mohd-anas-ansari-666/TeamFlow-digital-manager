import { Request } from 'express';

// User Types
export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  user?: User;
  teamId: string;
  role: UserRole;
  joinedAt: string;
}

// Project Types
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  status: ProjectStatus;
  progress: number;
  dueDate?: string;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

// Task Types
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  assignee?: User;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isOverdue: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export type ChatChannelType = 'team' | 'project' | 'direct';

export interface ChatChannel {
  id: string;
  name?: string;
  type: ChatChannelType;
  teamId?: string;
  projectId?: string;
  participants?: User[];
  unreadCount?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  sender?: User;
  channelId: string;
  createdAt: string;
  isRead: boolean;
}

// Standup Types
export interface Standup {
  id: string;
  userId: string;
  user?: User;
  teamId: string;
  date: string;
  yesterday: string;
  today: string;
  blockers?: string;
  createdAt: string;
}

// Insight Types
export type InsightType = 'risk' | 'health' | 'suggestion';
export type InsightSeverity = 'low' | 'medium' | 'high';

export interface ProjectInsight {
  id: string;
  projectId: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  createdAt: string;
}

// Workload Types
export interface UserWorkload {
  userId: string;
  user?: User;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  workloadPercentage: number;
  isOverloaded: boolean;
}

// Dashboard Types
export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  projectsAtRisk: number;
  averageProgress: number;
}

// Auth Types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}