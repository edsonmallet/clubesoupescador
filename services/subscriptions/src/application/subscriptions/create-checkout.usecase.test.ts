import { describe, expect, it, vi } from 'vitest'
import { Plan } from '../../domain/entities/plan'
import { Subscription } from '../../domain/entities/subscription'
import {
  PlanNotFoundError,
  SubscriptionAlreadyActiveError,
} from '../../domain/errors'
import { CreateCheckoutUseCase } from './create-checkout.usecase'

function makePlan(overrides: Partial<Parameters<typeof Plan.create>[0]> = {}) {
  return Plan.create({
    id: 'plan-1',
    tenantId: 'tenant-1',
    name: 'Assinatura Mensal',
    priceCents: 1990,
    active: true,
    createdAt: new Date(),
    ...overrides,
  })
}

function makeSubscription(
  overrides: Partial<Parameters<typeof Subscription.create>[0]> = {},
) {
  return Subscription.create({
    id: 'sub-1',
    tenantId: 'tenant-1',
    uid: 'uid-1',
    planId: 'plan-1',
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    status: 'inactive',
    totalXp: 0,
    levelId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
}

describe('CreateCheckoutUseCase', () => {
  it('throws PlanNotFoundError when the plan does not exist for the tenant', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    }
    const subscriptionRepository = {
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await expect(
      usecase.execute({ uid: 'uid-1', tenantId: 'tenant-1', planId: 'plan-1' }),
    ).rejects.toThrow(PlanNotFoundError)
  })

  it('throws SubscriptionAlreadyActiveError when the subscriber is already active', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findByUid: vi
        .fn()
        .mockResolvedValue(makeSubscription({ status: 'active' })),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await expect(
      usecase.execute({ uid: 'uid-1', tenantId: 'tenant-1', planId: 'plan-1' }),
    ).rejects.toThrow(SubscriptionAlreadyActiveError)
  })

  it('creates an Asaas customer, subscription, and a local inactive subscriber, returning the payment URL', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn().mockResolvedValue(null),
      createCustomer: vi.fn().mockResolvedValue({ id: 'cus_1' }),
      createSubscription: vi.fn().mockResolvedValue({
        id: 'asub_1',
        status: 'PENDING',
        paymentLink: 'https://pay.asaas.com/x',
      }),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
    })

    expect(asaasClient.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: 'uid-1' }),
    )
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        value: 19.9,
        cycle: 'MONTHLY',
      }),
    )
    expect(subscriptionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        uid: 'uid-1',
        planId: 'plan-1',
        asaasCustomerId: 'cus_1',
        asaasSubscriptionId: 'asub_1',
        status: 'inactive',
      }),
    )
    expect(result).toEqual({ paymentUrl: 'https://pay.asaas.com/x' })
  })

  it('reuses an existing Asaas customer instead of creating a duplicate', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi
        .fn()
        .mockResolvedValue({ id: 'cus_existing' }),
      createCustomer: vi.fn(),
      createSubscription: vi
        .fn()
        .mockResolvedValue({ id: 'asub_1', status: 'PENDING' }),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
    })

    expect(asaasClient.createCustomer).not.toHaveBeenCalled()
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    )
  })
})
