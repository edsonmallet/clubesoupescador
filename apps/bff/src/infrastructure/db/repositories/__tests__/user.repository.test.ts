import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { tenants } from '../../schema/tenants'
import { UserRepository } from '../user.repository'

describe('UserRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: UserRepository
  let tenantId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new UserRepository(db)

    const [tenant] = await db
      .insert(tenants)
      .values({ slug: 'dev', name: 'Dev Tenant', ownerUid: 'owner-1' })
      .returning()

    tenantId = tenant.id
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a user and finds it by uid + tenant', async () => {
    const created = await repository.create({
      tenantId,
      uid: 'firebase-uid-1',
      role: 'user',
    })

    const found = await repository.findByUid('firebase-uid-1', tenantId)

    expect(found?.id).toBe(created.id)
    expect(found?.uid).toBe('firebase-uid-1')
    expect(found?.role).toBe('user')
    expect(found?.tenantId).toBe(tenantId)
  })

  it('returns null when the uid does not exist for the tenant', async () => {
    const found = await repository.findByUid('unknown-uid', tenantId)
    expect(found).toBeNull()
  })
})
