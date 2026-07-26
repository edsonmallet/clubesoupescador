import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const communitySchema = pgSchema('community')

export const reportStatusEnum = communitySchema.enum('report_status', [
  'pending',
  'reviewed',
  'dismissed',
])

export const categories = communitySchema.table(
  'categories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    tenantSlugIdx: uniqueIndex('categories_tenant_slug_idx').on(
      table.tenantId,
      table.slug,
    ),
  }),
)

export const topics = communitySchema.table('topics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  authorUid: text('author_uid').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  locked: boolean('locked').notNull().default(false),
  deleted: boolean('deleted').notNull().default(false),
  voteScore: integer('vote_score').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const comments = communitySchema.table('comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  topicId: uuid('topic_id')
    .notNull()
    .references(() => topics.id),
  authorUid: text('author_uid').notNull(),
  parentId: uuid('parent_id'),
  depth: smallint('depth').notNull().default(0),
  body: text('body').notNull(),
  voteScore: integer('vote_score').notNull().default(0),
  deleted: boolean('deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const reactions = communitySchema.table(
  'reactions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    uid: text('uid').notNull(),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uniqueReactionIdx: uniqueIndex('reactions_unique_idx').on(
      table.targetType,
      table.targetId,
      table.uid,
      table.emoji,
    ),
  }),
)

export const votes = communitySchema.table(
  'votes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    uid: text('uid').notNull(),
    value: smallint('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uniqueVoteIdx: uniqueIndex('votes_unique_idx').on(
      table.targetType,
      table.targetId,
      table.uid,
    ),
  }),
)

export const reports = communitySchema.table('reports', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reporterUid: text('reporter_uid').notNull(),
  reason: text('reason').notNull(),
  status: reportStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
