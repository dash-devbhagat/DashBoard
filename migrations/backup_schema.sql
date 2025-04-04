-- Backup schema
CREATE TABLE IF NOT EXISTS team_members_backup AS SELECT * FROM team_members;
CREATE TABLE IF NOT EXISTS projects_backup AS SELECT * FROM projects;
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;
CREATE TABLE IF NOT EXISTS allocations_backup AS SELECT * FROM allocations;
CREATE TABLE IF NOT EXISTS timeline_phases_backup AS SELECT * FROM timeline_phases;