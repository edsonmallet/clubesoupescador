-- Row-Level Security for the tenant-scoped tables of the raffles schema.
-- Mirrors services/subscriptions/src/infrastructure/db/migrations/0001_tenant_rls.sql:
-- current_setting uses missing_ok=true because nothing sets app.tenant_id yet,
-- and the superuser connection bypasses RLS regardless.
ALTER TABLE "raffles"."raffles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "raffles"."raffles"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "raffles"."tickets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "raffles"."tickets"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
