import { sql } from 'drizzle-orm'
import {
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const rafflesSchema = pgSchema('raffles')

export const raffleStatusEnum = rafflesSchema.enum('raffle_status', [
  'open',
  'closed',
  'drawn',
])

export const ticketStatusEnum = rafflesSchema.enum('ticket_status', [
  'pending',
  'confirmed',
])

export const ticketSourceEnum = rafflesSchema.enum('ticket_source', [
  'subscription_conversion',
  'purchase',
])

export const raffles = rafflesSchema.table('raffles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  prize: text('prize').notNull(),
  imageUrl: text('image_url'),
  ticketPriceCents: integer('ticket_price_cents').notNull(),
  status: raffleStatusEnum('status').notNull().default('open'),
  contestNumber: integer('contest_number'),
  winnerTicket: integer('winner_ticket'),
  winnerUid: text('winner_uid'),
  drawnAt: timestamp('drawn_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const tickets = rafflesSchema.table(
  'tickets',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    raffleId: uuid('raffle_id')
      .notNull()
      .references(() => raffles.id),
    uid: text('uid').notNull(),
    number: integer('number').notNull(),
    status: ticketStatusEnum('status').notNull().default('pending'),
    source: ticketSourceEnum('source').notNull(),
    asaasPaymentId: text('asaas_payment_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    raffleNumberIdx: uniqueIndex('tickets_raffle_number_idx').on(
      table.raffleId,
      table.number,
    ),
  }),
)
