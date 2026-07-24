CREATE SCHEMA "tenants";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tenants"."domain_type" AS ENUM('subdomain', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tenants"."template_id" AS ENUM('clube-simples', 'clube-premium');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tenants"."tenant_status" AS ENUM('active', 'suspended', 'canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants"."domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"type" "tenants"."domain_type" NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants"."landing_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" "tenants"."template_id" NOT NULL,
	"theme" jsonb NOT NULL,
	"sections" jsonb NOT NULL,
	"seo" jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"plan_id" uuid,
	"status" "tenants"."tenant_status" DEFAULT 'active' NOT NULL,
	"owner_uid" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenants"."domains" ADD CONSTRAINT "domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenants"."landing_configs" ADD CONSTRAINT "landing_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "domains_domain_idx" ON "tenants"."domains" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants"."tenants" USING btree ("slug");
--> statement-breakpoint
-- current_setting uses missing_ok=true: nothing in this codebase sets
-- app.tenant_id yet (that's a future per-request transaction-scoping task),
-- so the strict 1-arg form would hard-error on every query. The superuser
-- connection (`postgres`) bypasses RLS regardless; this only matters once a
-- non-superuser app role exists, and then it fails closed (0 rows) instead
-- of erroring.
ALTER TABLE "tenants"."domains" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants"."domains"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "tenants"."landing_configs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants"."landing_configs"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);