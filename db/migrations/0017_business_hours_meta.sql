ALTER TABLE "businesses" ADD COLUMN "hours_source" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "hours_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "google_place_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_google_place_id_idx" ON "businesses" USING btree ("google_place_id");