import { describe, expect, it, vi } from 'vitest'
import { Level } from '../../domain/entities/level'
import { Subscription } from '../../domain/entities/subscription'
import { SubscriptionNotFoundError } from '../../domain/errors'
import { GrantXpUseCase } from './grant-xp.usecase'

function makeSubscription(totalXp: number) {
  return Subscription.create({
    id: 'sub-1',
    tenantId: 'tenant-1',
    uid: 'uid-1',
    planId: 'plan-1',
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    status: 'active',
    totalXp,
    levelId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('GrantXpUseCase', () => {
  it('throws when the subscription does not exist', async () => {
    const subscriptionRepository = {
      findMany: vi.fn(),
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      updateXp: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    }
    const levelRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      findHighestForXp: vi.fn(),
    }
    const insertXpEvent = vi.fn()

    const usecase = new GrantXpUseCase(
      subscriptionRepository,
      levelRepository,
      insertXpEvent,
    )

    await expect(
      usecase.execute({
        subscriptionId: 'sub-1',
        tenantId: 'tenant-1',
        amount: 50,
        source: 'subscription_payment',
      }),
    ).rejects.toThrow(SubscriptionNotFoundError)
  })

  it('adds the XP, records the event, and updates the level when it changed', async () => {
    const subscription = makeSubscription(480)
    const bronze = Level.create({
      id: 'level-bronze',
      name: 'Bronze',
      minXp: 0,
      storeDiscountPct: 5,
      cashbackPct: 3,
    })
    const prata = Level.create({
      id: 'level-prata',
      name: 'Prata',
      minXp: 500,
      storeDiscountPct: 10,
      cashbackPct: 4,
    })
    const updated = makeSubscription(530)

    const subscriptionRepository = {
      findMany: vi.fn(),
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      updateXp: vi.fn().mockResolvedValue(updated),
      findById: vi.fn().mockResolvedValue(subscription),
    }
    const levelRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      findHighestForXp: vi.fn().mockResolvedValue(prata),
    }
    const insertXpEvent = vi.fn()

    const usecase = new GrantXpUseCase(
      subscriptionRepository,
      levelRepository,
      insertXpEvent,
    )

    const result = await usecase.execute({
      subscriptionId: 'sub-1',
      tenantId: 'tenant-1',
      amount: 50,
      source: 'subscription_payment',
    })

    expect(levelRepository.findHighestForXp).toHaveBeenCalledWith(530)
    expect(subscriptionRepository.updateXp).toHaveBeenCalledWith(
      'sub-1',
      530,
      'level-prata',
    )
    expect(insertXpEvent).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      subscriberId: 'sub-1',
      amount: 50,
      source: 'subscription_payment',
    })
    expect(result).toBe(updated)
    void bronze
  })
})
