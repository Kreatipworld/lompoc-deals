-- Keyword position tracking (Google Search Console).
-- docs/superpowers/specs/2026-09-30-keyword-positions-design.md
-- Additive only. Applied by hand to Neon (like 0024–0030).

CREATE TABLE IF NOT EXISTS "gsc_daily" (
  "id" serial PRIMARY KEY,
  "date" date NOT NULL,
  "query" text NOT NULL,
  "page" text NOT NULL,
  "clicks" integer NOT NULL DEFAULT 0,
  "impressions" integer NOT NULL DEFAULT 0,
  "ctr" real NOT NULL DEFAULT 0,
  "position" real NOT NULL DEFAULT 0,
  "fetched_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_daily_date_query_page_idx" ON "gsc_daily" ("date", "query", "page");
CREATE INDEX IF NOT EXISTS "gsc_daily_query_date_idx" ON "gsc_daily" ("query", "date");
CREATE INDEX IF NOT EXISTS "gsc_daily_page_date_idx" ON "gsc_daily" ("page", "date");

CREATE TABLE IF NOT EXISTS "tracked_keywords" (
  "id" serial PRIMARY KEY,
  "keyword" text NOT NULL UNIQUE,
  "target_path" text,
  "business_id" integer REFERENCES "businesses"("id") ON DELETE SET NULL,
  "note" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
