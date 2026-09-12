-- Lompoc Football hub: varsity schedules + results for both high schools,
-- synced from MaxPreps (facts only). Additive only.
CREATE TABLE IF NOT EXISTS "football_games" (
  "id" serial PRIMARY KEY,
  "school" varchar(16) NOT NULL,            -- 'lompoc' | 'cabrillo'
  "season" integer NOT NULL,
  "game_date" date NOT NULL,
  "kickoff" varchar(20),                    -- e.g. "7:00 PM"
  "opponent" varchar(120) NOT NULL,
  "home_away" varchar(8) NOT NULL DEFAULT 'home', -- 'home' | 'away' | 'neutral'
  "venue" varchar(200),
  "league_game" boolean NOT NULL DEFAULT false,
  "result" varchar(1),                      -- 'W' | 'L' | 'T'
  "score_for" integer,
  "score_against" integer,
  "maxpreps_url" varchar(500) NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "football_games_school_date_idx" ON "football_games" ("school", "game_date");
-- The crosstown game shares one MaxPreps URL for both schools: the key is (school, url).
ALTER TABLE "football_games" DROP CONSTRAINT IF EXISTS "football_games_maxpreps_url_key";
CREATE UNIQUE INDEX IF NOT EXISTS "football_games_school_url_idx" ON "football_games" ("school", "maxpreps_url");
