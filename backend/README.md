# Digital Manager Backend API

Complete backend implementation for the Digital Manager application with PostgreSQL (Supabase), Express, and TypeScript.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tsfycexnmscbeimqdgmb.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Database Setup

Your database should already be set up with the schema from `db_schema.sql`. Verify tables exist:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 4. Run the Server

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

Server will run on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include token in request headers:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "createdAt": "2024-12-16T10:00:00Z",
    "updatedAt": "2024-12-16T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Users

#### Get Current User
```http
GET /api/users/me
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": null,
  "role": "member",
  "createdAt": "2024-12-16T10:00:00Z",
  "updatedAt": "2024-12-16T10:00:00Z"
}
```

#### Get All Users
```http
GET /api/users
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Update Current User
```http
PUT /api/users/me
```

**Request Body:**
```json
{
  "name": "John Updated",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

### Teams

#### Get Teams
```http
GET /api/teams
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Product Team",
    "description": "Main product team",
    "ownerId": "uuid",
    "members": [
      {
        "id": "uuid",
        "userId": "uuid",
        "teamId": "uuid",
        "role": "owner",
        "joinedAt": "2024-01-01T00:00:00Z",
        "user": { ... }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Team by ID
```http
GET /api/teams/:id
```

#### Create Team
```http
POST /api/teams
```

**Request Body:**
```json
{
  "name": "New Team",
  "description": "Team description"
}
```

#### Get Team Members
```http
GET /api/teams/:teamId/members
```

#### Add Team Member
```http
POST /api/teams/:teamId/members
```

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "member"
}
```

---

### Projects

#### Get Projects
```http
GET /api/projects?teamId=uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Website Redesign",
    "description": "Complete overhaul",
    "teamId": "uuid",
    "status": "active",
    "progress": 68,
    "dueDate": "2025-01-15",
    "taskCount": 24,
    "completedTaskCount": 16,
    "createdAt": "2024-10-01T00:00:00Z",
    "updatedAt": "2024-12-15T00:00:00Z"
  }
]
```

#### Get Project by ID
```http
GET /api/projects/:id
```

#### Create Project
```http
POST /api/projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "teamId": "uuid",
  "status": "active",
  "dueDate": "2025-03-31"
}
```

#### Update Project
```http
PUT /api/projects/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "completed"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
```

**Response:** `204 No Content`

---

### Tasks

#### Get Tasks
```http
GET /api/tasks?projectId=uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Design homepage mockups",
    "description": "Create mockups for homepage",
    "projectId": "uuid",
    "assigneeId": "uuid",
    "assignee": {
      "id": "uuid",
      "name": "Sarah Chen",
      "email": "sarah@example.com",
      "avatar": null,
      "role": "admin"
    },
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2024-12-18",
    "isOverdue": false,
    "tags": ["design", "ui"],
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-12-15T00:00:00Z"
  }
]
```

#### Get Task by ID
```http
GET /api/tasks/:id
```

#### Create Task
```http
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "projectId": "uuid",
  "assigneeId": "uuid",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2025-01-20",
  "tags": ["frontend", "react"]
}
```

#### Update Task
```http
PUT /api/tasks/:id
```

**Request Body:**
```json
{
  "title": "Updated Task",
  "status": "in-progress",
  "priority": "high"
}
```

#### Update Task Status
```http
PATCH /api/tasks/:id/status
```

**Request Body:**
```json
{
  "status": "done"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
```

**Response:** `204 No Content`

---

### Chat

#### Get Chat Channels
```http
GET /api/chat/channels
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "General",
    "type": "team",
    "teamId": "uuid",
    "projectId": null,
    "participants": [{ ... }],
    "unreadCount": 3,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Channel by ID
```http
GET /api/chat/channels/:id
```

#### Create Channel
```http
POST /api/chat/channels
```

**Request Body:**
```json
{
  "name": "Project Discussion",
  "type": "project",
  "projectId": "uuid",
  "participantIds": ["uuid1", "uuid2"]
}
```

#### Get Messages
```http
GET /api/chat/channels/:channelId/messages?limit=50
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "content": "Hello team!",
    "senderId": "uuid",
    "sender": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "role": "member"
    },
    "channelId": "uuid",
    "createdAt": "2024-12-16T10:30:00Z",
    "isRead": false
  }
]
```

#### Send Message
```http
POST /api/chat/messages
```

**Request Body:**
```json
{
  "channelId": "uuid",
  "content": "Hello team!"
}
```

#### Mark Messages as Read
```http
PATCH /api/chat/channels/:channelId/read
```

**Response:** `204 No Content`

---

### Standups

#### Get Standups
```http
GET /api/standups?teamId=uuid&date=2024-12-16
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "user": { ... },
    "teamId": "uuid",
    "date": "2024-12-16",
    "yesterday": "Completed homepage mockups",
    "today": "Will work on about page",
    "blockers": "None",
    "createdAt": "2024-12-16T09:00:00Z"
  }
]
```

#### Get Standup by ID
```http
GET /api/standups/:id
```

#### Submit Standup
```http
POST /api/standups
```

**Request Body:**
```json
{
  "teamId": "uuid",
  "date": "2024-12-16",
  "yesterday": "Worked on navigation component",
  "today": "Will implement user authentication",
  "blockers": "Waiting for API specs"
}
```

---

### Insights

#### Get Insights
```http
GET /api/insights?projectId=uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "projectId": "uuid",
    "type": "risk",
    "severity": "high",
    "title": "Overdue Tasks Detected",
    "description": "3 tasks are overdue. This may impact deadlines.",
    "createdAt": "2024-12-16T00:00:00Z"
  }
]
```

#### Create Insight
```http
POST /api/insights
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "type": "suggestion",
  "severity": "medium",
  "title": "Consider Adding Tests",
  "description": "Project lacks test coverage"
}
```

#### Generate Insights for Project
```http
POST /api/insights/generate/:projectId
```

**Response:** `200 OK` - Returns array of generated insights

#### Delete Insight
```http
DELETE /api/insights/:id
```

**Response:** `204 No Content`

---

### Dashboard

#### Get Dashboard Metrics
```http
GET /api/dashboard/metrics
```

**Response:** `200 OK`
```json
{
  "totalProjects": 10,
  "activeProjects": 7,
  "totalTasks": 85,
  "completedTasks": 42,
  "overdueTasks": 3,
  "teamMembers": 12,
  "projectsAtRisk": 2,
  "averageProgress": 65
}
```

#### Get Team Workload
```http
GET /api/dashboard/workload/:teamId
```

**Response:** `200 OK`
```json
[
  {
    "userId": "uuid",
    "user": { ... },
    "totalTasks": 8,
    "completedTasks": 4,
    "overdueTasks": 1,
    "inProgressTasks": 3,
    "workloadPercentage": 100,
    "isOverloaded": true
  }
]
```

---

## Frontend Integration

Update your frontend `api.ts` to call these endpoints:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from storage
const getAuthToken = () => localStorage.getItem('authToken');

// Example: Get current user
export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

// Example: Create task
export async function createTask(task: any): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

## Business Logic

### Automatic Task Overdue Detection
Tasks are automatically marked as overdue when their `due_date` passes and status is not "done" (handled by database trigger).

### Automatic Project Progress
Project progress is automatically calculated based on task completion ratio (handled by database trigger).

### Workload Calculation
- `workloadPercentage` = (totalTasks / 8) * 100
- `isOverloaded` = workloadPercentage > 80

### Insight Generation
The `/api/insights/generate/:projectId` endpoint automatically analyzes:
- Overdue tasks
- Project completion status
- Stale projects on hold
- Projects with no completed tasks

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Team membership verification
- Project access verification
- SQL injection prevention (parameterized queries)
- CORS configuration
- Helmet security headers

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins in `src/app.ts`
4. Enable SSL for database connection
5. Set up proper logging
6. Use environment variables for all secrets
7. Run `npm run build` and `npm start`

## License

MIT