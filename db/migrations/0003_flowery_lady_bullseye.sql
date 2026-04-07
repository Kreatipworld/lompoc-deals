CREATE TYPE "public"."listing_type" AS ENUM('for-sale', 'for-rent');--> statement-breakpoint
CREATE TABLE "property_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"type" "listing_type" NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"beds" integer,
	"baths" double precision,
	"sqft" integer,
	"address" text,
	"image_url" varchar(1000),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;