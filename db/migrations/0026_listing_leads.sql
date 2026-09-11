-- Listing leads: a buyer's tour/contact request from a home page or an agent profile.
-- Additive only. The listing page owns the buyer; the agent gets the email and the
-- dashboard counts the lead.
CREATE TABLE IF NOT EXISTS "listing_leads" (
  "id" serial PRIMARY KEY,
  "business_id" integer NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "listing_id" integer REFERENCES "property_listings"("id") ON DELETE SET NULL,
  "kind" varchar(16) NOT NULL DEFAULT 'contact',
  "name" varchar(200) NOT NULL,
  "email" varchar(320) NOT NULL,
  "phone" varchar(50),
  "message" text,
  "preferred_time" varchar(200),
  "source_path" varchar(300),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "emailed_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "listing_leads_business_idx" ON "listing_leads" ("business_id", "created_at");
