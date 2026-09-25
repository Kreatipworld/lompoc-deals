-- Lompoc Sales — a local marketplace (phase 1).
-- docs/superpowers/specs/2026-09-25-sales-marketplace-design.md
-- Additive only. Applied by hand to Neon on 2026-09-25 (like 0024–0029).
--
-- TODO (after the ship that replaces /garage-sales): DROP TABLE "garage_sales" and
-- DROP TYPE "garage_sale_status", delete app/api/garage-sales and the garageSales
-- job in lib/translate-content.ts. Kept in this phase for rollback safety.

CREATE TYPE "sale_kind" AS ENUM ('item', 'garage-sale', 'vehicle');
CREATE TYPE "sale_status" AS ENUM ('pending', 'active', 'sold', 'expired', 'hidden', 'rejected');

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sales_blocked_at" timestamptz;

CREATE TABLE IF NOT EXISTS "sale_listings" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" "sale_kind" NOT NULL,
  "category" varchar(32) NOT NULL,
  "title" varchar(120) NOT NULL,
  "description" text NOT NULL,
  "description_es" text,
  "price_cents" integer,
  "price_type" varchar(8) NOT NULL DEFAULT 'fixed',
  "condition" varchar(12),
  "attrs" jsonb,
  "photos" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "address" text,
  "area" varchar(60),
  "lat" double precision,
  "lng" double precision,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "contact_phone" varchar(30),
  "show_phone" boolean NOT NULL DEFAULT false,
  "status" "sale_status" NOT NULL DEFAULT 'pending',
  "reject_reason" text,
  "expires_at" timestamptz NOT NULL,
  "view_count" integer NOT NULL DEFAULT 0,
  "approved_at" timestamptz,
  "approved_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "sale_listings_status_expires_idx" ON "sale_listings" ("status", "expires_at");
CREATE INDEX IF NOT EXISTS "sale_listings_category_status_idx" ON "sale_listings" ("category", "status");
CREATE INDEX IF NOT EXISTS "sale_listings_user_idx" ON "sale_listings" ("user_id");

CREATE TABLE IF NOT EXISTS "sale_messages" (
  "id" serial PRIMARY KEY,
  "listing_id" integer NOT NULL REFERENCES "sale_listings"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "email" varchar(320) NOT NULL,
  "phone" varchar(50),
  "message" text NOT NULL,
  "source_path" varchar(300),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "emailed_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "sale_messages_listing_email_idx" ON "sale_messages" ("listing_id", "email", "created_at");

CREATE TABLE IF NOT EXISTS "sale_reports" (
  "id" serial PRIMARY KEY,
  "listing_id" integer NOT NULL REFERENCES "sale_listings"("id") ON DELETE CASCADE,
  "reporter_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "reporter_email" varchar(320),
  "reason" varchar(40) NOT NULL,
  "note" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" varchar(100) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- The old garage_sales rows (all from April 2026) become expired garage-sale
-- listings. Rows with no poster are skipped: a listing must belong to a user.
INSERT INTO "sale_listings"
  ("user_id", "kind", "category", "title", "description", "description_es", "photos",
   "address", "lat", "lng", "starts_at", "ends_at", "status", "expires_at", "created_at", "updated_at")
SELECT
  g."posted_by_user_id",
  'garage-sale',
  'garage-sales',
  left('Garage sale — ' || g."address", 120),
  g."description",
  g."description_es",
  coalesce(g."photos", '[]'::jsonb),
  g."address",
  g."lat",
  g."lng",
  g."start_date",
  g."end_date",
  'expired',
  g."end_date",
  g."created_at",
  g."created_at"
FROM "garage_sales" g
WHERE g."posted_by_user_id" IS NOT NULL;
