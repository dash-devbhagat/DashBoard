-- Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "avatar" text,
  "availability" integer NOT NULL DEFAULT 100
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "start_date" text NOT NULL,
  "end_date" text NOT NULL,
  "description" text,
  "color" text NOT NULL DEFAULT '#2563eb'
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" SERIAL PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'not-started',
  "estimated_hours" integer NOT NULL,
  "due_date" text NOT NULL,
  "category" text NOT NULL,
  "project_id" integer REFERENCES "projects"("id") ON DELETE SET NULL,
  "assignee_id" integer REFERENCES "team_members"("id") ON DELETE SET NULL
);

-- Create allocations table
CREATE TABLE IF NOT EXISTS "allocations" (
  "id" SERIAL PRIMARY KEY,
  "team_member_id" integer NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "percentage" integer NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text NOT NULL
);

-- Create timeline_phases table
CREATE TABLE IF NOT EXISTS "timeline_phases" (
  "id" SERIAL PRIMARY KEY,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "start_week" integer NOT NULL,
  "duration_weeks" integer NOT NULL,
  "color" text NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks" ("project_id");
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks" ("assignee_id");
CREATE INDEX IF NOT EXISTS "allocations_team_member_id_idx" ON "allocations" ("team_member_id");
CREATE INDEX IF NOT EXISTS "allocations_project_id_idx" ON "allocations" ("project_id");
CREATE INDEX IF NOT EXISTS "timeline_phases_project_id_idx" ON "timeline_phases" ("project_id");