-- Row-Level Security for the tenant-scoped tables of the cashback schema.
-- Mirrors services/subscriptions/src/infrastructure/db/migrations/0001_tenant_rls.sql:
-- current_setting uses missing_ok=true because nothing sets app.tenant_id yet,
-- and the superuser connection bypasses RLS regardless.
ALTER TABLE "cashback"."ledger" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "cashback"."ledger"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "cashback"."config" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "cashback"."config"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
