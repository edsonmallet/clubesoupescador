import { sql } from 'drizzle-orm'
import {
  boolean,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const tenantsSchema = pgSchema('tenants')

export const tenantStatusEnum = tenantsSchema.enum('tenant_status', [
  'active',
  'suspended',
  'canceled',
])

export const domainTypeEnum = tenantsSchema.enum('domain_type', [
  'subdomain',
  'custom',
])

export const templateIdEnum = tenantsSchema.enum('template_id', [
  'clube-simples',
  'clube-premium',
])

// Mirrors @clube/shared-types's Role union — keep both in sync.
export const userRoleEnum = tenantsSchema.enum('user_role', [
  'super_admin',
  'store_owner',
  'store_manager',
  'community_mod',
  'subscriber',
  'user',
])

export const tenants = tenantsSchema.table(
  'tenants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
    planId: uuid('plan_id'),
    status: tenantStatusEnum('status').notNull().default('active'),
    ownerUid: text('owner_uid').notNull(),
    settings: jsonb('settings')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    slugIdx: uniqueIndex('tenants_slug_idx').on(table.slug),
  }),
)

export const domains = tenantsSchema.table(
  'domains',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    domain: text('domain').notNull(),
    type: domainTypeEnum('type').notNull(),
    verified: boolean('verified').notNull().default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    domainIdx: uniqueIndex('domains_domain_idx').on(table.domain),
  }),
)

export const users = tenantsSchema.table(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    uid: text('uid').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uidTenantIdx: uniqueIndex('users_uid_tenant_idx').on(
      table.uid,
      table.tenantId,
    ),
  }),
)

export const landingConfigs = tenantsSchema.table('landing_configs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  templateId: templateIdEnum('template_id').notNull(),
  theme: jsonb('theme').$type<Record<string, unknown>>().notNull(),
  sections: jsonb('sections').$type<Record<string, unknown>>().notNull(),
  seo: jsonb('seo').$type<Record<string, unknown>>().notNull(),
  published: boolean('published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
