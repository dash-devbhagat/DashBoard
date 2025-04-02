-- Add skills column to team_members table
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "skills" text[] DEFAULT '{}';