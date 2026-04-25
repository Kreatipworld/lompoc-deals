CREATE TYPE "public"."feed_post_type" AS ENUM('for_sale', 'info');--> statement-breakpoint
CREATE TYPE "public"."feed_post_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'sold');--> statement-breakpoint
CREATE TABLE "feed_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"posted_by_user_id" integer NOT NULL,
	"type" "feed_post_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"photos" jsonb,
	"price_cents" integer,
	"sale_starts_at" timestamp with time zone,
	"sale_ends_at" timestamp with time zone,
	"address" varchar(300),
	"lat" double precision,
	"lng" double precision,
	"status" "feed_post_status" DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_user_id" integer,
	"rejection_reason" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_posted_by_user_id_users_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_posts_status_expires_idx" ON "feed_posts" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "feed_posts_type_status_idx" ON "feed_posts" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "feed_posts_posted_by_idx" ON "feed_posts" USING btree ("posted_by_user_id");
