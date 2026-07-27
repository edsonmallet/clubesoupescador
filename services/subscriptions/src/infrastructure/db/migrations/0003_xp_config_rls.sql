-- Row-Level Security for xp_config, added after the fact — mirrors
-- 0001_tenant_rls.sql's pattern for the other tenant-scoped tables here.
ALTER TABLE "subscriptions"."xp_config" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "subscriptions"."xp_config"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
