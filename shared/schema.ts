import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Team Member Schema
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  availability: integer("availability").notNull().default(100), // Percentage available
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  name: true,
  role: true,
  avatar: true,
  availability: true,
});

// Project Schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, completed, on-hold
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#2563eb"), // Project color for UI
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  status: true,
  startDate: true,
  endDate: true,
  description: true,
  color: true,
});

// Task Schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("unassigned"), // unassigned, in-progress, completed
  estimatedHours: integer("estimated_hours").notNull(),
  dueDate: timestamp("due_date").notNull(),
  category: text("category").notNull(), // Frontend, Backend, UI/UX, QA, etc.
  projectId: integer("project_id"),
  assigneeId: integer("assignee_id"),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  priority: true,
  status: true,
  estimatedHours: true,
  dueDate: true,
  category: true,
  projectId: true,
  assigneeId: true,
});

// Resource Allocation Schema
export const allocations = pgTable("allocations", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull(),
  projectId: integer("project_id").notNull(),
  percentage: integer("percentage").notNull(), // Percentage of time allocated to this project
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
});

export const insertAllocationSchema = createInsertSchema(allocations).pick({
  teamMemberId: true,
  projectId: true,
  percentage: true,
  startDate: true,
  endDate: true,
});

// Timeline Phase Schema
export const timelinePhases = pgTable("timeline_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(), // Planning, Design, Development, Testing, Deployment
  startWeek: integer("start_week").notNull(), // Week number relative to project start
  durationWeeks: integer("duration_weeks").notNull(), // Number of weeks
  color: text("color").notNull(), // Phase color
});

export const insertTimelinePhaseSchema = createInsertSchema(timelinePhases).pick({
  projectId: true,
  name: true,
  startWeek: true,
  durationWeeks: true,
  color: true,
});

// Types
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Allocation = typeof allocations.$inferSelect;
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;

export type TimelinePhase = typeof timelinePhases.$inferSelect;
export type InsertTimelinePhase = z.infer<typeof insertTimelinePhaseSchema>;
