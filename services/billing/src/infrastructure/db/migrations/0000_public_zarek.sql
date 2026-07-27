CREATE SCHEMA "billing";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "billing"."billing_status" AS ENUM('inactive', 'active', 'overdue', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing"."saas_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing"."tenant_billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"asaas_customer_id" text,
	"asaas_subscription_id" text,
	"status" "billing"."billing_status" DEFAULT 'inactive' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing"."tenant_billing" ADD CONSTRAINT "tenant_billing_plan_id_saas_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "billing"."saas_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_billing_tenant_idx" ON "billing"."tenant_billing" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_billing_asaas_subscription_idx" ON "billing"."tenant_billing" USING btree ("asaas_subscription_id");