import { pgTable, text, serial, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Team Member Schema
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  availability: integer("availability").notNull().default(100), // Percentage available
  skills: text("skills").array(), // Array of skills
}, (table) => ({
  roleIdx: index("team_members_role_idx").on(table.role), // Helpful for filtering by role
}));

// Project Schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, completed, pending
  startDate: text("start_date").notNull(), // Keep as text to maintain compatibility
  endDate: text("end_date").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#2563eb"), // Project color for UI
}, (table) => ({
  statusIdx: index("projects_status_idx").on(table.status), // Helpful for filtering by status
  nameIdx: uniqueIndex("projects_name_idx").on(table.name), // Ensure project names are unique
}));

// Resource Allocation Schema
export const allocations = pgTable("allocations", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembers.id, { onDelete: 'cascade' }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  percentage: integer("percentage").notNull(), // Percentage of time allocated to this project
  startDate: text("start_date").notNull(), // Keep as text to maintain compatibility
  endDate: text("end_date").notNull(),
}, (table) => ({
  teamMemberIdIdx: index("allocations_team_member_id_idx").on(table.teamMemberId),
  projectIdIdx: index("allocations_project_id_idx").on(table.projectId),
  dateRangeIdx: index("allocations_date_range_idx").on(table.startDate, table.endDate),
}));

// Timeline Phase Schema
export const timelinePhases = pgTable("timeline_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(), // Planning, Design, Development, Testing, Deployment
  startWeek: integer("start_week").notNull(), // Week number relative to project start
  durationWeeks: integer("duration_weeks").notNull(), // Number of weeks
  color: text("color").notNull(), // Phase color
}, (table) => ({
  projectIdIdx: index("timeline_phases_project_id_idx").on(table.projectId),
}));

// Relations
export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  allocations: many(allocations),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  allocations: many(allocations),
  timelinePhases: many(timelinePhases),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [allocations.teamMemberId],
    references: [teamMembers.id],
  }),
  project: one(projects, {
    fields: [allocations.projectId],
    references: [projects.id],
  }),
}));

export const timelinePhasesRelations = relations(timelinePhases, ({ one }) => ({
  project: one(projects, {
    fields: [timelinePhases.projectId],
    references: [projects.id],
  }),
}));

// Enhanced validation for team members
export const insertTeamMemberSchema = createInsertSchema(teamMembers)
  .pick({
    name: true,
    role: true,
    avatar: true,
    availability: true,
    skills: true,
  })
  .extend({
    name: z.string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .refine(val => /^[a-zA-Z\s\-']+$/.test(val), {
        message: "Name must contain only letters, spaces, hyphens, and apostrophes"
      }),
    role: z.string()
      .min(2, "Role must be at least 2 characters")
      .max(50, "Role cannot exceed 50 characters"),
    avatar: z.string().url("Avatar must be a valid URL").nullable().optional(),
    availability: z.number()
      .int("Availability must be a whole number")
      .min(0, "Availability cannot be negative")
      .max(100, "Availability cannot exceed 100%"),
    skills: z.array(z.string()).optional().default([]),
  });

// Enhanced validation for projects
export const insertProjectSchema = createInsertSchema(projects)
  .pick({
    name: true,
    status: true,
    startDate: true,
    endDate: true,
    description: true,
    color: true,
  })
  .extend({
    name: z.string()
      .min(3, "Project name must be at least 3 characters")
      .max(100, "Project name cannot exceed 100 characters")
      .refine(val => /^[a-zA-Z0-9\s\-_]+$/.test(val), {
        message: "Project name must contain only alphanumeric characters, spaces, hyphens, and underscores"
      }),
    status: z.enum(["active", "completed", "pending"], {
      errorMap: () => ({ message: "Status must be one of: active, completed, pending" }),
    }),
    startDate: z.string()
      .refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Start date must be in the format YYYY-MM-DD",
      }),
    endDate: z.string()
      .refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "End date must be in the format YYYY-MM-DD",
      }),
    description: z.string().max(500, "Description cannot exceed 500 characters").nullable().optional(),
    color: z.string()
      .refine(val => /^#[0-9A-Fa-f]{6}$/.test(val), {
        message: "Color must be a valid hex code (e.g., #2563eb)",
      }),
  })
  .refine(
    data => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

// Enhanced validation for allocations
export const insertAllocationSchema = createInsertSchema(allocations)
  .pick({
    teamMemberId: true,
    projectId: true,
    percentage: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    teamMemberId: z.number()
      .int("Team member ID must be an integer")
      .positive("Team member ID must be positive"),
    projectId: z.number()
      .int("Project ID must be an integer")
      .positive("Project ID must be positive"),
    percentage: z.number()
      .int("Allocation percentage must be a whole number")
      .min(1, "Allocation percentage must be at least 1%")
      .max(100, "Allocation percentage cannot exceed 100%"),
    startDate: z.string()
      .refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Start date must be in the format YYYY-MM-DD",
      }),
    endDate: z.string()
      .refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "End date must be in the format YYYY-MM-DD",
      }),
  })
  .refine(
    data => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

// Enhanced validation for timeline phases
export const insertTimelinePhaseSchema = createInsertSchema(timelinePhases)
  .pick({
    projectId: true,
    name: true,
    startWeek: true,
    durationWeeks: true,
    color: true,
  })
  .extend({
    projectId: z.number()
      .int("Project ID must be an integer")
      .positive("Project ID must be positive"),
    name: z.string()
      .min(2, "Phase name must be at least 2 characters")
      .max(50, "Phase name cannot exceed 50 characters"),
    startWeek: z.number()
      .int("Start week must be an integer")
      .min(0, "Start week cannot be negative"),
    durationWeeks: z.number()
      .int("Duration must be an integer")
      .min(1, "Duration must be at least 1 week")
      .max(52, "Duration cannot exceed 52 weeks"),
    color: z.string()
      .refine(val => /^#[0-9A-Fa-f]{6}$/.test(val), {
        message: "Color must be a valid hex code (e.g., #2563eb)",
      }),
  });

// Types
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Allocation = typeof allocations.$inferSelect;
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;

export type TimelinePhase = typeof timelinePhases.$inferSelect;
export type InsertTimelinePhase = z.infer<typeof insertTimelinePhaseSchema>;

// Extra types for dashboard
export type DashboardStats = {
  activeProjects: number;
  teamUtilizationAvg: number;
  zeroAllocationCount: number; // Count of team members with 0% allocation
  fullyAllocatedCount: number; // Count of team members with 100% or more allocation
};

export type TeamUtilization = {
  role: string;
  memberCount: number;
  utilizationPercentage: number;
};
