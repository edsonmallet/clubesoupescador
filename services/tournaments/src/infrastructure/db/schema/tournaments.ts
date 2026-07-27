import { sql } from 'drizzle-orm'
import { integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const tournamentsSchema = pgSchema('tournaments')

export const tournamentStatusEnum = tournamentsSchema.enum('tournament_status', [
  'open',
  'closed',
])

export const tournaments = tournamentsSchema.table('tournaments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: tournamentStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const submissions = tournamentsSchema.table('submissions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  tournamentId: uuid('tournament_id')
    .notNull()
    .references(() => tournaments.id),
  authorUid: text('author_uid').notNull(),
  mediaUrl: text('media_url').notNull(),
  voteScore: integer('vote_score').notNull().default(0),
  manualScore: integer('manual_score'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
