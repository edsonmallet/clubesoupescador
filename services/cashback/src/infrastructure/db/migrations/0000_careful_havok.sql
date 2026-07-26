CREATE SCHEMA "cashback";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "cashback"."entry_type" AS ENUM('earned_purchase', 'redeemed', 'expired_to_xp', 'manual_adjustment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cashback"."config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source" text NOT NULL,
	"pct" numeric(5, 2) NOT NULL,
	"expiry_months" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cashback"."ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uid" text NOT NULL,
	"type" "cashback"."entry_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"source" text NOT NULL,
	"source_id" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "config_tenant_source_idx" ON "cashback"."config" USING btree ("tenant_id","source");