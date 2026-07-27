import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { saasPlans } from '../../schema/billing'
import { TenantBillingRepository } from '../tenant-billing.repository'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

describe('TenantBillingRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: TenantBillingRepository
  let planId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new TenantBillingRepository(db)

    const [plan] = await db
      .insert(saasPlans)
      .values({ name: 'Plano', priceCents: 9900, active: true })
      .returning({ id: saasPlans.id })
    planId = plan.id
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a tenant billing row and finds it by tenantId', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      planId,
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_1',
      status: 'inactive',
    })

    const found = await repository.findByTenantId(TENANT_ID)
    expect(found?.id).toBe(created.id)
    expect(found?.status).toBe('inactive')
  })

  it('finds a tenant billing row by asaas subscription id', async () => {
    const found = await repository.findByAsaasSubscriptionId('asub_1')
    expect(found?.tenantId).toBe(TENANT_ID)
  })

  it('returns null when nothing matches', async () => {
    expect(
      await repository.findByTenantId('00000000-0000-0000-0000-000000000099'),
    ).toBeNull()
    expect(
      await repository.findByAsaasSubscriptionId('does-not-exist'),
    ).toBeNull()
  })

  it('updates the status', async () => {
    const created = await repository.create({
      tenantId: '00000000-0000-0000-0000-000000000002',
      planId,
      asaasCustomerId: 'cus_2',
      asaasSubscriptionId: 'asub_2',
      status: 'inactive',
    })

    const updated = await repository.updateStatus(created.id, 'active')
    expect(updated.status).toBe('active')
  })

  it('updates the asaas details', async () => {
    const created = await repository.create({
      tenantId: '00000000-0000-0000-0000-000000000003',
      planId,
      asaasCustomerId: 'cus_3',
      asaasSubscriptionId: 'asub_3',
      status: 'inactive',
    })

    const updated = await repository.updateAsaasDetails(created.id, {
      planId,
      asaasCustomerId: 'cus_3_new',
      asaasSubscriptionId: 'asub_3_new',
      status: 'active',
    })

    expect(updated.asaasCustomerId).toBe('cus_3_new')
    expect(updated.asaasSubscriptionId).toBe('asub_3_new')
    expect(updated.status).toBe('active')
  })

  it('lists all tenant billings', async () => {
    const found = await repository.list()
    expect(found.length).toBeGreaterThanOrEqual(3)
  })
})
