CREATE TABLE IF NOT EXISTS "subscriptions"."xp_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source" text NOT NULL,
	"points" integer NOT NULL,
	"daily_cap" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "xp_config_tenant_source_idx" ON "subscriptions"."xp_config" USING btree ("tenant_id","source");