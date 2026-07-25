CREATE SCHEMA "subscriptions";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscriptions"."subscription_status" AS ENUM('inactive', 'active', 'overdue', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions"."levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"min_xp" integer NOT NULL,
	"store_discount_pct" numeric(5, 2) NOT NULL,
	"cashback_pct" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions"."plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions"."subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uid" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"asaas_customer_id" text,
	"asaas_subscription_id" text,
	"status" "subscriptions"."subscription_status" DEFAULT 'inactive' NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions"."xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions"."subscribers" ADD CONSTRAINT "subscribers_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "subscriptions"."plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions"."subscribers" ADD CONSTRAINT "subscribers_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "subscriptions"."levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions"."xp_events" ADD CONSTRAINT "xp_events_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "subscriptions"."subscribers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_uid_tenant_idx" ON "subscriptions"."subscribers" USING btree ("uid","tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_asaas_subscription_idx" ON "subscriptions"."subscribers" USING btree ("asaas_subscription_id");