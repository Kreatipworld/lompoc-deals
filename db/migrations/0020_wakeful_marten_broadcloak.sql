ALTER TABLE "businesses" ADD COLUMN "email" varchar(320);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "emails_json" jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "email_source" text;