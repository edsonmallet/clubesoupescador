-- Row-Level Security for the tenant-scoped tables of the store schema.
-- Mirrors services/subscriptions/src/infrastructure/db/migrations/0001_tenant_rls.sql:
-- current_setting uses missing_ok=true because nothing sets app.tenant_id yet,
-- and the superuser connection bypasses RLS regardless. order_items has no
-- tenant_id of its own (scoped indirectly through orders), so it is left out.
ALTER TABLE "store"."products" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "store"."products"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "store"."orders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "store"."orders"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
