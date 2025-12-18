import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequestBody } from '../middleware/validation';
import { requireTeamMember, requireProjectAccess } from '../middleware/permissions';

import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as teamController from '../controllers/teamController';
import * as projectController from '../controllers/projectController';
import * as taskController from '../controllers/taskController';
import * as chatController from '../controllers/chatController';
import * as standupController from '../controllers/standupController';
import * as insightController from '../controllers/insightController';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

// ============================================
// Auth Routes
// ============================================
router.post('/auth/register', validateRequestBody(['name', 'email', 'password']), authController.register);
router.post('/auth/login', validateRequestBody(['email', 'password']), authController.login);

// ============================================
// User Routes
// ============================================
router.get('/users/me', authenticateToken, userController.getCurrentUser);
router.get('/users', authenticateToken, userController.getUsers);
router.get('/users/:id', authenticateToken, userController.getUserById);
router.put('/users/me', authenticateToken, userController.updateUser);

// ============================================
// Team Routes
// ============================================
router.get('/teams', authenticateToken, teamController.getTeams);
router.get('/teams/:id', authenticateToken, teamController.getTeamById);
router.post('/teams', authenticateToken, validateRequestBody(['name']), teamController.createTeam);
router.get('/teams/:teamId/members', authenticateToken, requireTeamMember, teamController.getTeamMembers);
router.post('/teams/:teamId/members', authenticateToken, requireTeamMember, validateRequestBody(['userId']), teamController.addTeamMember);

// ============================================
// Project Routes
// ============================================
router.get('/projects', authenticateToken, projectController.getProjects);
router.get('/projects/:id', authenticateToken, requireProjectAccess, projectController.getProjectById);
router.post('/projects', authenticateToken, validateRequestBody(['name', 'teamId']), projectController.createProject);
router.put('/projects/:id', authenticateToken, requireProjectAccess, projectController.updateProject);
router.delete('/projects/:id', authenticateToken, requireProjectAccess, projectController.deleteProject);

// ============================================
// Task Routes
// ============================================
router.get('/tasks', authenticateToken, taskController.getTasks);
router.get('/tasks/:id', authenticateToken, taskController.getTaskById);
router.post('/tasks', authenticateToken, validateRequestBody(['title', 'projectId']), taskController.createTask);
router.put('/tasks/:id', authenticateToken, taskController.updateTask);
router.patch('/tasks/:id/status', authenticateToken, validateRequestBody(['status']), taskController.updateTaskStatus);
router.delete('/tasks/:id', authenticateToken, taskController.deleteTask);

// ============================================
// Chat Routes
// ============================================
router.get('/chat/channels', authenticateToken, chatController.getChatChannels);
router.get('/chat/channels/:id', authenticateToken, chatController.getChannelById);
router.post('/chat/channels', authenticateToken, validateRequestBody(['type', 'participantIds']), chatController.createChannel);
router.get('/chat/channels/:channelId/messages', authenticateToken, chatController.getMessages);
router.post('/chat/messages', authenticateToken, validateRequestBody(['channelId', 'content']), chatController.sendMessage);
router.patch('/chat/channels/:channelId/read', authenticateToken, chatController.markAsRead);

// ============================================
// Standup Routes
// ============================================
router.get('/standups', authenticateToken, standupController.getStandups);
router.get('/standups/:id', authenticateToken, standupController.getStandupById);
router.post('/standups', authenticateToken, validateRequestBody(['teamId', 'date', 'yesterday', 'today']), standupController.submitStandup);

// ============================================
// Insight Routes
// ============================================
router.get('/insights', authenticateToken, insightController.getInsights);
router.post('/insights', authenticateToken, validateRequestBody(['projectId', 'type', 'severity', 'title', 'description']), insightController.createInsight);
router.post('/insights/generate/:projectId', authenticateToken, requireProjectAccess, insightController.generateInsights);
router.delete('/insights/:id', authenticateToken, insightController.deleteInsight);

// ============================================
// Dashboard Routes
// ============================================
router.get('/dashboard/metrics', authenticateToken, dashboardController.getDashboardMetrics);
router.get('/dashboard/workload/:teamId', authenticateToken, requireTeamMember, dashboardController.getTeamWorkload);

export default router;