ALTER TABLE "businesses" ADD COLUMN "about" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "about_source" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "amenities_json" jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "amenities_source" text;
