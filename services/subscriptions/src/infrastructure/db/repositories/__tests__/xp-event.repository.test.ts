import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { SubscriptionRepository } from '../subscription.repository'
import { XpEventRepository } from '../xp-event.repository'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

describe('XpEventRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: XpEventRepository
  let subscriberId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new XpEventRepository(db)

    const [plan] = await db
      .insert(schema.plans)
      .values({
        tenantId: TENANT_ID,
        name: 'Plano',
        priceCents: 1990,
        active: true,
      })
      .returning({ id: schema.plans.id })

    const subscription = await new SubscriptionRepository(db).create({
      tenantId: TENANT_ID,
      uid: 'uid-xp',
      planId: plan.id,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      status: 'active',
    })
    subscriberId = subscription.id
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('inserts an XP event row', async () => {
    await repository.insert({
      tenantId: TENANT_ID,
      subscriberId,
      amount: 50,
      source: 'subscription_payment',
    })

    const rows = await db
      .select()
      .from(schema.xpEvents)
      .where(eq(schema.xpEvents.subscriberId, subscriberId))

    expect(rows).toHaveLength(1)
    expect(rows[0].amount).toBe(50)
    expect(rows[0].source).toBe('subscription_payment')
    expect(rows[0].tenantId).toBe(TENANT_ID)
  })
})
