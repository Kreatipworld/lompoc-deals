-- Make password_hash nullable to support Google OAuth users (no password)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
--> statement-breakpoint
-- Add google_id for OAuth account linking
ALTER TABLE "users" ADD COLUMN "google_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");
