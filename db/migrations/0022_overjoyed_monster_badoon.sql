CREATE TYPE "public"."coupon_claim_status" AS ENUM('claimed', 'redeemed', 'void');--> statement-breakpoint
CREATE TABLE "coupon_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"code" varchar(12) NOT NULL,
	"status" "coupon_claim_status" DEFAULT 'claimed' NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by" integer
);
--> statement-breakpoint
-- NOTE: drizzle-kit also emitted ADD COLUMN for activities.photos_json and
-- businesses.sponsor_exclusive here. Both columns already existed in the database
-- (pre-existing schema drift, unrelated to coupons), so replaying them would fail.
-- They are removed so this file matches exactly what was applied.
ALTER TABLE "deals" ADD COLUMN "max_redemptions" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "max_per_day" integer;--> statement-breakpoint
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_claims_code_unique" ON "coupon_claims" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_claims_deal_user_unique" ON "coupon_claims" USING btree ("deal_id","user_id");