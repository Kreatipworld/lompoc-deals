CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"address" varchar(500),
	"lat" double precision,
	"lng" double precision,
	"image_url" varchar(1000),
	"tips" text,
	"seasonality" varchar(200),
	"source_url" varchar(1000),
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "activities_slug_idx" ON "activities" USING btree ("slug");
