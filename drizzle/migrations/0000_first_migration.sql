CREATE TABLE IF NOT EXISTS "team_members" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "role" text NOT NULL,
    "avatar" text NOT NULL,
    "availability" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "status" text NOT NULL,
    "startDate" text NOT NULL,
    "endDate" text NOT NULL,
    "description" text NOT NULL,
    "color" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "priority" text NOT NULL,
    "status" text NOT NULL,
    "estimatedHours" integer NOT NULL,
    "dueDate" text NOT NULL,
    "category" text NOT NULL,
    "projectId" integer,
    "assigneeId" integer,
    CONSTRAINT "tasks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assigneeId_team_members_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "allocations" (
    "id" serial PRIMARY KEY NOT NULL,
    "teamMemberId" integer NOT NULL,
    "projectId" integer NOT NULL,
    "percentage" integer NOT NULL,
    "startDate" text NOT NULL,
    "endDate" text NOT NULL,
    CONSTRAINT "allocations_teamMemberId_team_members_id_fk" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "allocations_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "timeline_phases" (
    "id" serial PRIMARY KEY NOT NULL,
    "projectId" integer NOT NULL,
    "name" text NOT NULL,
    "startWeek" integer NOT NULL,
    "durationWeeks" integer NOT NULL,
    "color" text NOT NULL,
    CONSTRAINT "timeline_phases_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);