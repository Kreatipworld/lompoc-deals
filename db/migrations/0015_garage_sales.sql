-- Garage sales: community-posted yard/garage sales
CREATE TYPE "garage_sale_status" AS ENUM ('active', 'expired', 'removed');

CREATE TABLE IF NOT EXISTS "garage_sales" (
  "id" serial PRIMARY KEY,
  "posted_by_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "address" text NOT NULL,
  "lat" double precision,
  "lng" double precision,
  "description" text NOT NULL,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone NOT NULL,
  "start_time" varchar(10),
  "end_time" varchar(10),
  "item_categories" jsonb,
  "photos" jsonb,
  "status" "garage_sale_status" NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
