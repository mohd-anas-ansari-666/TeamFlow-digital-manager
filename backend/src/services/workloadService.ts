import { query } from '../config/database';
import { UserWorkload, DashboardMetrics } from '../types';

export const getTeamWorkload = async (teamId: string): Promise<UserWorkload[]> => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.avatar, u.role, u.created_at,
            COUNT(t.id) as total_tasks,
            COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
            COUNT(t.id) FILTER (WHERE t.is_overdue = true) as overdue_tasks,
            COUNT(t.id) FILTER (WHERE t.status = 'in-progress') as in_progress_tasks
     FROM users u
     INNER JOIN team_members tm ON u.id = tm.user_id
     LEFT JOIN tasks t ON u.id = t.assignee_id
     WHERE tm.team_id = $1
     GROUP BY u.id, u.name, u.email, u.avatar, u.role, u.created_at
     ORDER BY u.name`,
    [teamId]
  );

  const MAX_TASKS = 8;

  return result.rows.map(row => {
    const totalTasks = parseInt(row.total_tasks);
    const completedTasks = parseInt(row.completed_tasks);
    const overdueTasks = parseInt(row.overdue_tasks);
    const inProgressTasks = parseInt(row.in_progress_tasks);
    const workloadPercentage = Math.min(100, Math.round((totalTasks / MAX_TASKS) * 100));
    const isOverloaded = workloadPercentage > 80;

    return {
      userId: row.id,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.created_at,
      },
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks,
      workloadPercentage,
      isOverloaded,
    };
  });
};

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const projectsResult = await query(
    `SELECT 
       COUNT(*) as total_projects,
       COUNT(*) FILTER (WHERE status = 'active') as active_projects,
       COALESCE(AVG(progress), 0) as average_progress
     FROM projects`
  );

  const tasksResult = await query(
    `SELECT 
       COUNT(*) as total_tasks,
       COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
       COUNT(*) FILTER (WHERE is_overdue = true) as overdue_tasks
     FROM tasks`
  );

  const usersResult = await query('SELECT COUNT(*) as team_members FROM users');

  const insightsResult = await query(
    `SELECT COUNT(*) as projects_at_risk 
     FROM project_insights 
     WHERE type = 'risk' AND severity = 'high'`
  );

  const projects = projectsResult.rows[0];
  const tasks = tasksResult.rows[0];
  const users = usersResult.rows[0];
  const insights = insightsResult.rows[0];

  return {
    totalProjects: parseInt(projects.total_projects),
    activeProjects: parseInt(projects.active_projects),
    totalTasks: parseInt(tasks.total_tasks),
    completedTasks: parseInt(tasks.completed_tasks),
    overdueTasks: parseInt(tasks.overdue_tasks),
    teamMembers: parseInt(users.team_members),
    projectsAtRisk: parseInt(insights.projects_at_risk),
    averageProgress: Math.round(parseFloat(projects.average_progress)),
  };
};