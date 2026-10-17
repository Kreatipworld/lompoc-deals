-- Per-business search-result title descriptor (/biz/<slug> <title>).
-- Null keeps the default "Name — Lompoc, CA". Additive only. Applied by hand to Neon (like 0024–0031).

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "seo_descriptor" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "seo_descriptor_es" text;
