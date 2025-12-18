import { query } from '../config/database';
import { ProjectInsight, InsightType, InsightSeverity } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getInsights = async (projectId?: string): Promise<ProjectInsight[]> => {
  let sql = `
    SELECT id, project_id, type, severity, title, description, created_at
    FROM project_insights
  `;
  const params: any[] = [];

  if (projectId) {
    sql += ' WHERE project_id = $1';
    params.push(projectId);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows.map(mapInsightFromDb);
};

export const createInsight = async (data: {
  projectId: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
}): Promise<ProjectInsight> => {
  const { projectId, type, severity, title, description } = data;

  const result = await query(
    `INSERT INTO project_insights (project_id, type, severity, title, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, project_id, type, severity, title, description, created_at`,
    [projectId, type, severity, title, description]
  );

  return mapInsightFromDb(result.rows[0]);
};

export const generateInsightsForProject = async (projectId: string): Promise<ProjectInsight[]> => {
  const insights: ProjectInsight[] = [];

  const projectResult = await query(
    `SELECT id, name, status, progress, due_date, task_count, completed_task_count, updated_at
     FROM projects WHERE id = $1`,
    [projectId]
  );

  if (projectResult.rows.length === 0) {
    throw new AppError(404, 'Project not found');
  }

  const project = projectResult.rows[0];

  const tasksResult = await query(
    'SELECT COUNT(*) as overdue_count FROM tasks WHERE project_id = $1 AND is_overdue = true',
    [projectId]
  );
  const overdueCount = parseInt(tasksResult.rows[0].overdue_count);

  if (overdueCount > 0) {
    const insight = await createInsight({
      projectId,
      type: 'risk',
      severity: overdueCount > 3 ? 'high' : 'medium',
      title: 'Overdue Tasks Detected',
      description: `${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue. This may impact project deadlines.`,
    });
    insights.push(insight);
  }

  if (project.progress >= 80 && project.status === 'active') {
    const insight = await createInsight({
      projectId,
      type: 'health',
      severity: 'low',
      title: 'Project Nearing Completion',
      description: `${project.name} is ${project.progress}% complete and on track.`,
    });
    insights.push(insight);
  }

  if (project.status === 'on-hold') {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 5) {
      const insight = await createInsight({
        projectId,
        type: 'suggestion',
        severity: 'medium',
        title: 'Consider Resuming Project',
        description: `${project.name} has been on hold for ${daysSinceUpdate} days. Consider resuming or archiving.`,
      });
      insights.push(insight);
    }
  }

  if (project.task_count > 0 && project.completed_task_count === 0) {
    const insight = await createInsight({
      projectId,
      type: 'risk',
      severity: 'medium',
      title: 'No Completed Tasks',
      description: 'Project has tasks but none are completed. Team may need support.',
    });
    insights.push(insight);
  }

  return insights;
};

export const deleteInsight = async (insightId: string): Promise<void> => {
  const result = await query('DELETE FROM project_insights WHERE id = $1', [insightId]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'Insight not found');
  }
};

const mapInsightFromDb = (row: any): ProjectInsight => ({
  id: row.id,
  projectId: row.project_id,
  type: row.type,
  severity: row.severity,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
});