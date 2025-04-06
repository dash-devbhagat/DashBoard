CREATE TABLE "allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_member_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"percentage" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"week_end_date" text NOT NULL,
	"contract_hours" integer,
	"worked_hours" integer,
	"schedule_status" text,
	"quality_status" text,
	"resource_utilization_status" text,
	"client_satisfaction_status" text,
	"schedule_status_reason" text,
	"quality_status_reason" text,
	"resource_utilization_status_reason" text,
	"client_satisfaction_status_reason" text,
	"risks" text,
	"accomplishments" text,
	"next_steps" text,
	"right_team_status" text,
	"delivery_comments" text,
	"am_status" text,
	"am_comments" text,
	"governance_status" text,
	"last_governance_meeting_date" text,
	"last_invoice_date" text,
	"last_receivable_date" text,
	"next_invoice_date" text,
	"invoice_status" text,
	"risk_dependencies" text,
	"action_items" text,
	"action_item_owner" text
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#2563eb' NOT NULL,
	"category" text,
	"project_phase" text,
	"project_owner" text,
	"account_manager" text,
	"delivery_manager" text,
	"contract_status" text
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"avatar" text,
	"availability" integer DEFAULT 100 NOT NULL,
	"skills" text[]
);
--> statement-breakpoint
CREATE TABLE "timeline_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"start_week" integer NOT NULL,
	"duration_weeks" integer NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status" ADD CONSTRAINT "project_status_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_phases" ADD CONSTRAINT "timeline_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "allocations_team_member_id_idx" ON "allocations" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "allocations_project_id_idx" ON "allocations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "allocations_date_range_idx" ON "allocations" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "project_status_project_id_idx" ON "project_status" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_status_week_end_date_idx" ON "project_status" USING btree ("week_end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "project_status_project_week_idx" ON "project_status" USING btree ("project_id","week_end_date");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_name_idx" ON "projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category");--> statement-breakpoint
CREATE INDEX "team_members_role_idx" ON "team_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "timeline_phases_project_id_idx" ON "timeline_phases" USING btree ("project_id");