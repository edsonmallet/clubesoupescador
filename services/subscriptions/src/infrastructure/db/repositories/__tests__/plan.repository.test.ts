import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { PlanRepository } from '../plan.repository'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const OTHER_TENANT_ID = '00000000-0000-0000-0000-000000000002'

describe('PlanRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: PlanRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new PlanRepository(db)
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a plan and finds it by id', async () => {
    const [{ id }] = await db
      .insert(schema.plans)
      .values({
        tenantId: TENANT_ID,
        name: 'Assinatura Mensal',
        priceCents: 1990,
        active: true,
      })
      .returning({ id: schema.plans.id })

    const found = await repository.findById(id)
    expect(found?.name).toBe('Assinatura Mensal')
    expect(found?.priceCents).toBe(1990)
  })

  it('returns null when the plan does not exist', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    )
    expect(found).toBeNull()
  })

  it('lists only active plans scoped to the tenant', async () => {
    await db.insert(schema.plans).values([
      {
        tenantId: TENANT_ID,
        name: 'Ativo',
        priceCents: 1990,
        active: true,
      },
      {
        tenantId: TENANT_ID,
        name: 'Inativo',
        priceCents: 1990,
        active: false,
      },
      {
        tenantId: OTHER_TENANT_ID,
        name: 'Outro tenant',
        priceCents: 1990,
        active: true,
      },
    ])

    const found = await repository.findActiveByTenant(TENANT_ID)
    expect(found.every((plan) => plan.active)).toBe(true)
    expect(found.every((plan) => plan.tenantId === TENANT_ID)).toBe(true)
  })
})
