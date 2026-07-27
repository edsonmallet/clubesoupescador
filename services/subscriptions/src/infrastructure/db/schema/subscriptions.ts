import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const subscriptionsSchema = pgSchema('subscriptions')

export const subscriptionStatusEnum = subscriptionsSchema.enum(
  'subscription_status',
  ['inactive', 'active', 'overdue', 'cancelled'],
)

export const levels = subscriptionsSchema.table('levels', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  minXp: integer('min_xp').notNull(),
  storeDiscountPct: numeric('store_discount_pct', {
    precision: 5,
    scale: 2,
  }).notNull(),
  cashbackPct: numeric('cashback_pct', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const plans = subscriptionsSchema.table('plans', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const subscribers = subscriptionsSchema.table(
  'subscribers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    uid: text('uid').notNull(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    asaasCustomerId: text('asaas_customer_id'),
    asaasSubscriptionId: text('asaas_subscription_id'),
    status: subscriptionStatusEnum('status').notNull().default('inactive'),
    totalXp: integer('total_xp').notNull().default(0),
    levelId: uuid('level_id').references(() => levels.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uidTenantIdx: uniqueIndex('subscribers_uid_tenant_idx').on(
      table.uid,
      table.tenantId,
    ),
    asaasSubscriptionIdx: uniqueIndex('subscribers_asaas_subscription_idx').on(
      table.asaasSubscriptionId,
    ),
  }),
)

export const xpEvents = subscriptionsSchema.table('xp_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  subscriberId: uuid('subscriber_id')
    .notNull()
    .references(() => subscribers.id),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

// NOTE: not yet consumed by the XP-granting code paths across services
// (store, cashback, raffles, community, subscriptions itself) — those still
// award fixed constants matching CLAUDE.md's table. This gives the admin a
// real place to persist per-source values; wiring every grant call site to
// read from here is a separate, larger change.
export const xpConfig = subscriptionsSchema.table(
  'xp_config',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    source: text('source').notNull(),
    points: integer('points').notNull(),
    dailyCap: integer('daily_cap'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    tenantSourceIdx: uniqueIndex('xp_config_tenant_source_idx').on(
      table.tenantId,
      table.source,
    ),
  }),
)
