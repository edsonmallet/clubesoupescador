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
      findMany: vi.fn(),
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await expect(
      usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        planId: 'plan-1',
        name: 'Maria Souza',
        cpfCnpj: '12345678909',
      }),
    ).rejects.toThrow(PlanNotFoundError)
  })

  it('throws SubscriptionAlreadyActiveError when the subscriber is already active', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findMany: vi.fn(),
      findByUid: vi
        .fn()
        .mockResolvedValue(makeSubscription({ status: 'active' })),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await expect(
      usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        planId: 'plan-1',
        name: 'Maria Souza',
        cpfCnpj: '12345678909',
      }),
    ).rejects.toThrow(SubscriptionAlreadyActiveError)
  })

  it('creates an Asaas customer, subscription, and a local inactive subscriber, returning the payment URL', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findMany: vi.fn(),
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn().mockResolvedValue(null),
      createCustomer: vi.fn().mockResolvedValue({ id: 'cus_1' }),
      createSubscription: vi.fn().mockResolvedValue({
        id: 'asub_1',
        status: 'PENDING',
      }),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({
        data: [{ id: 'pay_1', invoiceUrl: 'https://pay.asaas.com/x' }],
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
      name: 'Maria Souza',
      cpfCnpj: '12345678909',
    })

    expect(asaasClient.createCustomer).toHaveBeenCalledWith({
      name: 'Maria Souza',
      cpfCnpj: '12345678909',
      externalReference: 'uid-1',
    })
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
    expect(asaasClient.listPaymentsBySubscription).toHaveBeenCalledWith(
      'asub_1',
    )
    expect(result).toEqual({ paymentUrl: 'https://pay.asaas.com/x' })
  })

  it('reuses an existing Asaas customer instead of creating a duplicate', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findMany: vi.fn(),
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
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
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
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
      name: 'Maria Souza',
      cpfCnpj: '12345678909',
    })

    expect(asaasClient.createCustomer).not.toHaveBeenCalled()
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    )
  })

  it('returns a null paymentUrl when Asaas has not generated a payment yet', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findMany: vi.fn(),
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn().mockResolvedValue({ id: 'c1' }),
      createCustomer: vi.fn(),
      createSubscription: vi
        .fn()
        .mockResolvedValue({ id: 'asub_1', status: 'PENDING' }),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
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
      name: 'Maria Souza',
      cpfCnpj: '12345678909',
    })

    expect(result).toEqual({ paymentUrl: null })
  })

  it.each(['inactive', 'overdue', 'cancelled'] as const)(
    'updates the existing %s subscriber in place instead of inserting a duplicate',
    async (status) => {
      const planRepository = {
        findActiveByTenant: vi.fn(),
        findById: vi.fn().mockResolvedValue(makePlan()),
      }
      const subscriptionRepository = {
        findMany: vi.fn(),
        findByUid: vi.fn().mockResolvedValue(
          makeSubscription({
            status,
            asaasCustomerId: 'cus_prior',
            asaasSubscriptionId: 'asub_old',
          }),
        ),
        findByAsaasSubscriptionId: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
        updateAsaasDetails: vi.fn().mockResolvedValue(makeSubscription()),
        updateXp: vi.fn(),
      }
      const asaasClient = {
        findCustomerByExternalReference: vi.fn(),
        createCustomer: vi.fn(),
        createSubscription: vi
          .fn()
          .mockResolvedValue({ id: 'asub_new', status: 'PENDING' }),
        listPaymentsBySubscription: vi.fn().mockResolvedValue({
          data: [{ id: 'pay_1', invoiceUrl: 'https://pay.asaas.com/new' }],
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
        name: 'Maria Souza',
        cpfCnpj: '12345678909',
      })

      // Never inserts again — that would violate subscribers_uid_tenant_idx.
      expect(subscriptionRepository.create).not.toHaveBeenCalled()
      // Reuses the stored Asaas customer, no lookup/create round-trip.
      expect(asaasClient.findCustomerByExternalReference).not.toHaveBeenCalled()
      expect(asaasClient.createCustomer).not.toHaveBeenCalled()
      expect(asaasClient.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_prior' }),
      )
      expect(subscriptionRepository.updateAsaasDetails).toHaveBeenCalledWith(
        'sub-1',
        {
          planId: 'plan-1',
          asaasCustomerId: 'cus_prior',
          asaasSubscriptionId: 'asub_new',
          status: 'inactive',
        },
      )
      expect(result).toEqual({ paymentUrl: 'https://pay.asaas.com/new' })
    },
  )
})
