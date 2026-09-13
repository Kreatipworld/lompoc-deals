-- Zillow-style listing form: home type (house / condo / townhome / manufactured / land / multi-family).
-- Additive only.
ALTER TABLE "property_listings" ADD COLUMN IF NOT EXISTS "home_type" varchar(24);
