import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { levels } from '../../schema/subscriptions'
import { LevelRepository } from '../level.repository'

describe('LevelRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: LevelRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new LevelRepository(db)

    await db.insert(levels).values([
      { name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' },
      { name: 'Prata', minXp: 500, storeDiscountPct: '10', cashbackPct: '4' },
      { name: 'Ouro', minXp: 1500, storeDiscountPct: '15', cashbackPct: '5' },
    ])
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('lists all levels', async () => {
    const all = await repository.findAll()
    expect(all).toHaveLength(3)
  })

  it('finds the highest level whose minXp does not exceed the given XP', async () => {
    const level = await repository.findHighestForXp(600)
    expect(level?.name).toBe('Prata')
  })

  it('returns null when no level qualifies', async () => {
    await db.delete(levels)
    const level = await repository.findHighestForXp(0)
    expect(level).toBeNull()
  })
})
