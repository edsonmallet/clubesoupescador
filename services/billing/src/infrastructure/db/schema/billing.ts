import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const billingSchema = pgSchema('billing')

export const billingStatusEnum = billingSchema.enum('billing_status', [
  'inactive',
  'active',
  'overdue',
  'cancelled',
])

export const saasPlans = billingSchema.table('saas_plans', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const tenantBilling = billingSchema.table(
  'tenant_billing',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    // No `.references()`: tenant lives in the BFF's schema and cross-schema
    // FKs are forbidden by CLAUDE.md — same rule already applied to
    // `plans.tenantId` in services/subscriptions/src/infrastructure/db/schema/subscriptions.ts.
    tenantId: uuid('tenant_id').notNull(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => saasPlans.id),
    asaasCustomerId: text('asaas_customer_id'),
    asaasSubscriptionId: text('asaas_subscription_id'),
    status: billingStatusEnum('status').notNull().default('inactive'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    tenantIdx: uniqueIndex('tenant_billing_tenant_idx').on(table.tenantId),
    asaasSubscriptionIdx: uniqueIndex(
      'tenant_billing_asaas_subscription_idx',
    ).on(table.asaasSubscriptionId),
  }),
)
