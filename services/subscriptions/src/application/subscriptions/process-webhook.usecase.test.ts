import { setRole } from '@clube/firebase-utils'
import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { schema } from '../../infrastructure/db/schema'
import { levels, plans } from '../../infrastructure/db/schema/subscriptions'
import { LevelRepository } from '../../infrastructure/db/repositories/level.repository'
import { SubscriptionRepository } from '../../infrastructure/db/repositories/subscription.repository'
import { GrantXpUseCase } from '../xp/grant-xp.usecase'
import { ProcessWebhookUseCase } from './process-webhook.usecase'

vi.mock('@clube/firebase-utils', () => ({
  setRole: vi.fn(),
  revokeRole: vi.fn(),
}))

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

describe('ProcessWebhookUseCase', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let subscriptionRepository: SubscriptionRepository
  let planId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    subscriptionRepository = new SubscriptionRepository(db)

    const [plan] = await db
      .insert(plans)
      .values({ tenantId: TENANT_ID, name: 'Plano', priceCents: 1990, active: true })
      .returning({ id: plans.id })
    planId = plan.id

    await db
      .insert(levels)
      .values({ name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' })
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function buildUseCase() {
    const levelRepository = new LevelRepository(db)
    const insertXpEvent = async () => {}
    const grantXpUseCase = new GrantXpUseCase(
      subscriptionRepository,
      levelRepository,
      insertXpEvent,
    )
    return new ProcessWebhookUseCase(subscriptionRepository, grantXpUseCase)
  }

  it('activates the subscriber, grants role, and grants XP on PAYMENT_CONFIRMED', async () => {
    const created = await subscriptionRepository.create({
      tenantId: TENANT_ID,
      uid: 'uid-confirmed',
      planId,
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_confirmed',
      status: 'inactive',
    })

    const usecase = buildUseCase()
    await usecase.execute({
      event: 'PAYMENT_CONFIRMED',
      payment: { subscription: 'asub_confirmed' },
    })

    const updated = await subscriptionRepository.findById(created.id)
    expect(updated?.status).toBe('active')
    expect(updated?.totalXp).toBe(50)
    expect(setRole).toHaveBeenCalledWith('uid-confirmed', 'subscriber', TENANT_ID)
  })

  it('marks the subscriber overdue and revokes the role on PAYMENT_OVERDUE', async () => {
    const { revokeRole } = await import('@clube/firebase-utils')
    const created = await subscriptionRepository.create({
      tenantId: TENANT_ID,
      uid: 'uid-overdue',
      planId,
      asaasCustomerId: 'cus_2',
      asaasSubscriptionId: 'asub_overdue',
      status: 'active',
    })

    const usecase = buildUseCase()
    await usecase.execute({
      event: 'PAYMENT_OVERDUE',
      payment: { subscription: 'asub_overdue' },
    })

    const updated = await subscriptionRepository.findById(created.id)
    expect(updated?.status).toBe('overdue')
    expect(revokeRole).toHaveBeenCalledWith('uid-overdue')
  })

  it('cancels the subscriber and revokes the role on SUBSCRIPTION_CANCELLED', async () => {
    const { revokeRole } = await import('@clube/firebase-utils')
    const created = await subscriptionRepository.create({
      tenantId: TENANT_ID,
      uid: 'uid-cancelled',
      planId,
      asaasCustomerId: 'cus_3',
      asaasSubscriptionId: 'asub_cancelled',
      status: 'active',
    })

    const usecase = buildUseCase()
    await usecase.execute({
      event: 'SUBSCRIPTION_CANCELLED',
      payment: { subscription: 'asub_cancelled' },
    })

    const updated = await subscriptionRepository.findById(created.id)
    expect(updated?.status).toBe('cancelled')
    expect(revokeRole).toHaveBeenCalledWith('uid-cancelled')
  })

  it('does nothing when no subscriber matches the Asaas subscription id', async () => {
    const usecase = buildUseCase()
    await expect(
      usecase.execute({
        event: 'PAYMENT_CONFIRMED',
        payment: { subscription: 'does-not-exist' },
      }),
    ).resolves.toBeUndefined()
  })
})
