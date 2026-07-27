import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { SaasPlanRepository } from '../saas-plan.repository'

describe('SaasPlanRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: SaasPlanRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new SaasPlanRepository(db)
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a plan and finds it by id', async () => {
    const created = await repository.create({
      name: 'Starter',
      priceCents: 9900,
      active: true,
    })

    const found = await repository.findById(created.id)
    expect(found?.name).toBe('Starter')
    expect(found?.priceCents).toBe(9900)
    expect(found?.active).toBe(true)
  })

  it('returns null when the plan does not exist', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    )
    expect(found).toBeNull()
  })

  it('lists all plans', async () => {
    await repository.create({
      name: 'Pro',
      priceCents: 19900,
      active: false,
    })

    const found = await repository.list()
    expect(found.length).toBeGreaterThanOrEqual(2)
  })

  it('updates a plan', async () => {
    const created = await repository.create({
      name: 'To Update',
      priceCents: 1000,
      active: true,
    })

    const updated = await repository.update(created.id, {
      name: 'Updated Name',
      active: false,
    })

    expect(updated.name).toBe('Updated Name')
    expect(updated.active).toBe(false)
    expect(updated.priceCents).toBe(1000)
  })
})
