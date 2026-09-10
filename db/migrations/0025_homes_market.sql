-- Homes market: realtor-input listings. Additive only.
ALTER TABLE "property_listings" ADD COLUMN IF NOT EXISTS "open_house_at" timestamptz;
ALTER TABLE "property_listings" ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;
