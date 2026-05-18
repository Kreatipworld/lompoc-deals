CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"user_id" integer,
	"session_id" varchar(36),
	"target_type" text,
	"target_id" integer,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_name_created_idx" ON "analytics_events" USING btree ("event_name","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_user_created_idx" ON "analytics_events" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_session_created_idx" ON "analytics_events" USING btree ("session_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_target_idx" ON "analytics_events" USING btree ("target_type","target_id");
