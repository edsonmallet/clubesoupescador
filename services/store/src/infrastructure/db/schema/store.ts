import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const storeSchema = pgSchema('store')

export const orderStatusEnum = storeSchema.enum('order_status', [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
])

export const products = storeSchema.table('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  priceFullCents: integer('price_full_cents').notNull(),
  priceClubCents: integer('price_club_cents').notNull(),
  stock: integer('stock').notNull().default(0),
  sku: text('sku').notNull(),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const orders = storeSchema.table('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  firebaseUid: text('firebase_uid').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  // Snapshot of the subscriber's level at purchase time (subscriptions.levels
  // is a different schema, so this is a plain id, not an FK). Needed later
  // by the payment webhook to compute earned cashback — that runs from a
  // BullMQ job with no user auth token, so it cannot call back into
  // subscriptions' authenticated /subscriptions/me at that point.
  levelId: uuid('level_id'),
  subtotalCents: integer('subtotal_cents').notNull(),
  levelDiscountAmtCents: integer('level_discount_amt_cents')
    .notNull()
    .default(0),
  cashbackUsedAmtCents: integer('cashback_used_amt_cents').notNull().default(0),
  shippingAmtCents: integer('shipping_amt_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),
  asaasPaymentId: text('asaas_payment_id'),
  trackingCode: text('tracking_code'),
  shippingLabelUrl: text('shipping_label_url'),
  address: jsonb('address')
    .$type<{
      zipCode: string
      street: string
      number: string
      complement: string | null
      neighborhood: string
      city: string
      state: string
    }>()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const orderItems = storeSchema.table('order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  qty: integer('qty').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 })
    .notNull()
    .default('0'),
})
