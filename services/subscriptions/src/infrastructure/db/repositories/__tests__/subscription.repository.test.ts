import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { SubscriptionRepository } from '../subscription.repository'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

describe('SubscriptionRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: SubscriptionRepository
  let planId: string
  let levelId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new SubscriptionRepository(db)

    const [plan] = await db
      .insert(schema.plans)
      .values({
        tenantId: TENANT_ID,
        name: 'Plano',
        priceCents: 1990,
        active: true,
      })
      .returning({ id: schema.plans.id })
    planId = plan.id

    const [level] = await db
      .insert(schema.levels)
      .values({
        name: 'Bronze',
        minXp: 0,
        storeDiscountPct: '5',
        cashbackPct: '3',
      })
      .returning({ id: schema.levels.id })
    levelId = level.id
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a subscription and finds it by uid + tenant', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-1',
      planId,
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_1',
      status: 'inactive',
    })

    const found = await repository.findByUid('uid-1', TENANT_ID)
    expect(found?.id).toBe(created.id)
    expect(found?.status).toBe('inactive')
  })

  it('finds a subscription by its Asaas subscription id', async () => {
    const found = await repository.findByAsaasSubscriptionId('asub_1')
    expect(found?.uid).toBe('uid-1')
  })

  it('updates status', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-2',
      planId,
      asaasCustomerId: 'cus_2',
      asaasSubscriptionId: 'asub_2',
      status: 'inactive',
    })

    const updated = await repository.updateStatus(created.id, 'active')
    expect(updated.status).toBe('active')
  })

  it('replaces Asaas details in place on a re-checkout without violating the uid+tenant unique index', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-retry',
      planId,
      asaasCustomerId: 'cus_retry',
      asaasSubscriptionId: 'asub_retry_old',
      status: 'cancelled',
    })

    const updated = await repository.updateAsaasDetails(created.id, {
      planId,
      asaasCustomerId: 'cus_retry',
      asaasSubscriptionId: 'asub_retry_new',
      status: 'inactive',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.asaasSubscriptionId).toBe('asub_retry_new')
    expect(updated.status).toBe('inactive')
    expect(await repository.findByAsaasSubscriptionId('asub_retry_old')).toBe(
      null,
    )
  })

  it('updates XP and level', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-3',
      planId,
      asaasCustomerId: 'cus_3',
      asaasSubscriptionId: 'asub_3',
      status: 'active',
    })

    const updated = await repository.updateXp(created.id, 50, levelId)
    expect(updated.totalXp).toBe(50)
    expect(updated.levelId).toBe(levelId)
  })
})
