ALTER TABLE "events" ADD COLUMN "source" varchar(50) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "events_source_external_id_idx" ON "events" ("source","external_id");
