CREATE SCHEMA "dashboard";
--> statement-breakpoint
CREATE SCHEMA "feedback";
--> statement-breakpoint
CREATE SCHEMA "organizations";
--> statement-breakpoint
CREATE TABLE "organizations"."audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"action" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "dashboard"."brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"design_md" text NOT NULL,
	"light_theme" jsonb NOT NULL,
	"dark_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dark_params_source" text DEFAULT 'default' NOT NULL,
	"dark_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_team_id_key" UNIQUE("team_id"),
	CONSTRAINT "brands_dark_params_source_check" CHECK ("dashboard"."brands"."dark_params_source" in ('default', 'agent', 'yours'))
);
--> statement-breakpoint
CREATE TABLE "feedback"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_kind_check" CHECK ("feedback"."events"."kind" in ('track', 'answer')),
	CONSTRAINT "events_name_check" CHECK (length("feedback"."events"."name") between 1 and 80),
	CONSTRAINT "events_subject_check" CHECK (length("feedback"."events"."subject") <= 200)
);
--> statement-breakpoint
CREATE TABLE "organizations"."members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_team_id_user_id_key" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations"."platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "platform_admins_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_key" UNIQUE("role_id","permission"),
	CONSTRAINT "role_permissions_permission_check" CHECK ("organizations"."role_permissions"."permission" in ('items:read', 'items:save', 'items:mark', 'rules:read', 'rules:write', 'activity:read', 'presets:write', 'members:manage', 'tokens:manage', 'settings:write', 'feedback:configure'))
);
--> statement-breakpoint
CREATE TABLE "organizations"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_team_id_name_key" UNIQUE("team_id","name"),
	CONSTRAINT "roles_id_team_id_key" UNIQUE("id","team_id"),
	CONSTRAINT "roles_name_check" CHECK (length("organizations"."roles"."name") between 1 and 40)
);
--> statement-breakpoint
CREATE TABLE "organizations"."teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_handle_key" UNIQUE("handle"),
	CONSTRAINT "teams_handle_check" CHECK ("organizations"."teams"."handle" ~ '^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$' and "organizations"."teams"."handle" not in ('about', 'admin', 'api', 'dashboard', 'disclosure', 'docs', 'feedback', 'mcp', 'organizations', 'privacy', 'r', 'registrydirectory'))
);
--> statement-breakpoint
CREATE TABLE "organizations"."tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"secret_hash" text NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_secret_hash_key" UNIQUE("secret_hash"),
	CONSTRAINT "tokens_name_check" CHECK (length("organizations"."tokens"."name") between 1 and 80),
	CONSTRAINT "tokens_scopes_check" CHECK (cardinality("organizations"."tokens"."scopes") > 0 and "organizations"."tokens"."scopes" <@ array['items:read', 'items:save', 'items:mark', 'rules:read', 'rules:write', 'activity:read', 'presets:write', 'members:manage', 'tokens:manage', 'settings:write', 'feedback:configure']::text[])
);
--> statement-breakpoint
CREATE TABLE "organizations"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth0_subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth0_subject_key" UNIQUE("auth0_subject")
);
--> statement-breakpoint
ALTER TABLE "organizations"."audit_log" ADD CONSTRAINT "audit_log_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "organizations"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."audit_log" ADD CONSTRAINT "audit_log_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."brands" ADD CONSTRAINT "brands_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "organizations"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."brands" ADD CONSTRAINT "brands_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback"."events" ADD CONSTRAINT "events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "organizations"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."members" ADD CONSTRAINT "members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "organizations"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."members" ADD CONSTRAINT "members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."members" ADD CONSTRAINT "members_role_fkey" FOREIGN KEY ("role_id","team_id") REFERENCES "organizations"."roles"("id","team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."platform_admins" ADD CONSTRAINT "platform_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."platform_admins" ADD CONSTRAINT "platform_admins_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."role_permissions" ADD CONSTRAINT "role_permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."role_permissions" ADD CONSTRAINT "role_permissions_role_fkey" FOREIGN KEY ("role_id","team_id") REFERENCES "organizations"."roles"("id","team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."roles" ADD CONSTRAINT "roles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "organizations"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."tokens" ADD CONSTRAINT "tokens_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "organizations"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations"."tokens" ADD CONSTRAINT "tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "organizations"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_team_name_created" ON "feedback"."events" USING btree ("team_id","name","created_at");