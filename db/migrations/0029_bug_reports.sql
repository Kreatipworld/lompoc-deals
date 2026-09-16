-- "Report a bug": one row per report from the error page, the 404 page, or the footer.
-- Owner (Sep 15 2026): "If things go wrong, show a button that says Report a bug —
-- that will make our platform smarter." Additive only.
CREATE TABLE IF NOT EXISTS "bug_reports" (
  "id" serial PRIMARY KEY,
  "route" varchar(500),
  "error_message" text,
  "digest" varchar(100),
  "description" text NOT NULL,
  "email" varchar(320),
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "user_agent" varchar(400),
  "locale" varchar(5),
  "source" varchar(16) NOT NULL DEFAULT 'error',
  "status" varchar(16) NOT NULL DEFAULT 'new',
  "admin_note" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "bug_reports_status_created_idx" ON "bug_reports" ("status", "created_at" DESC);
