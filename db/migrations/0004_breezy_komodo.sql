ALTER TABLE "property_listings" ADD COLUMN "zpid" varchar(50);--> statement-breakpoint
ALTER TABLE "property_listings" ADD COLUMN "detail_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "property_listings" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "property_listings" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "property_listings" ADD COLUMN "photos_json" jsonb;--> statement-breakpoint
ALTER TABLE "property_listings" ADD COLUMN "year_built" integer;--> statement-breakpoint
ALTER TABLE "property_listings" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_zpid_unique" UNIQUE("zpid");