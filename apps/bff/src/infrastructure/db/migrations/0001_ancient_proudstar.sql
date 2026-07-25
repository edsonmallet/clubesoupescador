DO $$ BEGIN
 CREATE TYPE "tenants"."user_role" AS ENUM('super_admin', 'store_owner', 'store_manager', 'community_mod', 'subscriber', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uid" text NOT NULL,
	"role" "tenants"."user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenants"."users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_uid_tenant_idx" ON "tenants"."users" USING btree ("uid","tenant_id");
--> statement-breakpoint
-- Same rationale as the 0000 migration: current_setting uses
-- missing_ok=true because nothing sets app.tenant_id yet, and the
-- superuser connection bypasses RLS regardless.
ALTER TABLE "tenants"."users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants"."users"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);