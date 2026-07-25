-- Row-Level Security for the tenant-scoped tables of the subscriptions schema.
-- Mirrors the precedent set by apps/bff's migrations: current_setting uses
-- missing_ok=true because nothing sets app.tenant_id yet, and the superuser
-- connection bypasses RLS regardless.
ALTER TABLE "subscriptions"."plans" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "subscriptions"."plans"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "subscriptions"."subscribers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "subscriptions"."subscribers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "subscriptions"."xp_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "subscriptions"."xp_events"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
