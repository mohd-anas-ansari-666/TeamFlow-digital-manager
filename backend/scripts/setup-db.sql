-- ============================================
-- Digital Manager Database Schema
-- PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_owner ON teams(owner_id);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold', 'archived')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date DATE,
    task_count INTEGER DEFAULT 0,
    completed_task_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in-progress', 'review', 'done')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    is_overdue BOOLEAN DEFAULT false,
    tags TEXT[], -- PostgreSQL array type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- CHAT CHANNELS TABLE
-- ============================================
CREATE TABLE chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('team', 'project', 'direct')),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_team ON chat_channels(team_id);
CREATE INDEX idx_channels_project ON chat_channels(project_id);

-- ============================================
-- CHAT CHANNEL PARTICIPANTS TABLE
-- ============================================
CREATE TABLE chat_channel_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_participants_channel ON chat_channel_participants(channel_id);
CREATE INDEX idx_participants_user ON chat_channel_participants(user_id);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_channel ON chat_messages(channel_id);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at DESC);

-- ============================================
-- STANDUPS TABLE
-- ============================================
CREATE TABLE standups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    yesterday TEXT NOT NULL,
    today TEXT NOT NULL,
    blockers TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, team_id, date)
);

CREATE INDEX idx_standups_team_date ON standups(team_id, date);
CREATE INDEX idx_standups_user ON standups(user_id);

-- ============================================
-- PROJECT INSIGHTS TABLE
-- ============================================
CREATE TABLE project_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('risk', 'health', 'suggestion')),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insights_project ON project_insights(project_id);
CREATE INDEX idx_insights_type ON project_insights(type);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER FOR TASK OVERDUE STATUS
-- ============================================
CREATE OR REPLACE FUNCTION update_task_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date IS NOT NULL AND NEW.status NOT IN ('done') THEN
        NEW.is_overdue = (NEW.due_date < CURRENT_DATE);
    ELSE
        NEW.is_overdue = false;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_task_overdue BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_task_overdue_status();

-- ============================================
-- TRIGGER FOR PROJECT PROGRESS CALCULATION
-- ============================================
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    new_progress INTEGER;
BEGIN
    -- Get project task counts
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
    INTO total_tasks, completed_tasks
    FROM tasks
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    -- Calculate progress
    IF total_tasks > 0 THEN
        new_progress := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
    ELSE
        new_progress := 0;
    END IF;
    
    -- Update project
    UPDATE projects
    SET 
        task_count = total_tasks,
        completed_task_count = completed_tasks,
        progress = new_progress,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================
-- Insert sample user (password: "password123")
-- Password hash generated with bcrypt, cost factor 10
INSERT INTO users (id, name, email, password_hash, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Alex Morgan', 'alex@company.com', '$2b$10$YourHashedPasswordHere', 'owner');
