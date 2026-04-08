-- Rename subscription tier enum values to match new pricing structure
ALTER TYPE subscription_tier RENAME VALUE 'basic' TO 'free';
ALTER TYPE subscription_tier RENAME VALUE 'pro' TO 'standard';

-- Update default value on subscriptions table
ALTER TABLE "subscriptions" ALTER COLUMN "tier" SET DEFAULT 'free';

-- Allow null Stripe customer ID for free-tier users
ALTER TABLE "subscriptions" ALTER COLUMN "stripe_customer_id" DROP NOT NULL;
