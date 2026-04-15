-- Add notification_emails preference to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_emails" boolean NOT NULL DEFAULT true;

-- Create business_follows table
CREATE TABLE IF NOT EXISTS "business_follows" (
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "business_id" integer NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "business_id")
);
