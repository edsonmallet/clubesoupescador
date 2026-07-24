import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { domains } from '../../schema/tenants'
import { TenantRepository } from '../tenant.repository'

describe('TenantRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: TenantRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new TenantRepository(db)
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a tenant and finds it by slug', async () => {
    const created = await repository.create({
      slug: 'dev',
      name: 'Dev Tenant',
      ownerUid: 'owner-uid-1',
    })

    const found = await repository.findBySlug('dev')

    expect(found?.id).toBe(created.id)
    expect(found?.slug).toBe('dev')
    expect(found?.status).toBe('active')
  })

  it('returns null when the slug does not exist', async () => {
    const found = await repository.findBySlug('does-not-exist')
    expect(found).toBeNull()
  })

  it('finds a tenant through a linked custom domain', async () => {
    const created = await repository.create({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-uid-2',
    })

    await db.insert(domains).values({
      tenantId: created.id,
      domain: 'acme.com.br',
      type: 'custom',
    })

    const found = await repository.findByDomain('acme.com.br')

    expect(found?.id).toBe(created.id)
  })

  it('returns null when the domain is not linked to any tenant', async () => {
    const found = await repository.findByDomain('unknown.com.br')
    expect(found).toBeNull()
  })
})
