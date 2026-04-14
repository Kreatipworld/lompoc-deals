-- Add user profile fields for local user signup
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "name" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "email_verified" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "zip" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "interests_json" JSONB;

-- Add business owner and plan management fields
ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "owner_full_name" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "plan_override" subscription_tier,
  ADD COLUMN IF NOT EXISTS "grace_period_ends_at" TIMESTAMP WITH TIME ZONE;
