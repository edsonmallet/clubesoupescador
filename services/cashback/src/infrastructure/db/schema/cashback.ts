import { sql } from 'drizzle-orm'
import {
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const cashbackSchema = pgSchema('cashback')

export const entryTypeEnum = cashbackSchema.enum('entry_type', [
  'earned_purchase',
  'redeemed',
  'expired_to_xp',
  'manual_adjustment',
])

// Immutable ledger — rows are only ever inserted, never updated or deleted.
// Balance is the plain SUM of amountCents across all rows: a credit and its
// later expiry/redemption are both explicit rows that net out to zero.
export const ledger = cashbackSchema.table('ledger', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  uid: text('uid').notNull(),
  type: entryTypeEnum('type').notNull(),
  amountCents: integer('amount_cents').notNull(),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  // Only set on credit rows; null for debit rows (redeemed/expired_to_xp).
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const config = cashbackSchema.table(
  'config',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    source: text('source').notNull(),
    pct: numeric('pct', { precision: 5, scale: 2 }).notNull(),
    expiryMonths: integer('expiry_months').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    tenantSourceIdx: uniqueIndex('config_tenant_source_idx').on(
      table.tenantId,
      table.source,
    ),
  }),
)
