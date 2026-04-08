ALTER TABLE "businesses"
  ADD COLUMN "stripe_connect_account_id" varchar(200),
  ADD COLUMN "stripe_connect_onboarding_complete" boolean NOT NULL DEFAULT false;
