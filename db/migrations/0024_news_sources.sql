-- News desk: primary-source pipeline. Additive only.
ALTER TABLE "news_leads" ADD COLUMN IF NOT EXISTS "kind" varchar(16) NOT NULL DEFAULT 'outlet';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "sources" jsonb;
