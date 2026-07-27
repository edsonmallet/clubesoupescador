import { describe, expect, it, vi } from 'vitest'
import { SaasPlan } from '../../domain/entities/saas-plan'
import { TenantBilling } from '../../domain/entities/tenant-billing'
import {
  PlanNotFoundError,
  TenantBillingAlreadyActiveError,
} from '../../domain/errors'
import { CreateCheckoutUseCase } from './create-checkout.usecase'

function makePlan(
  overrides: Partial<Parameters<typeof SaasPlan.create>[0]> = {},
) {
  return SaasPlan.create({
    id: 'plan-1',
    name: 'Starter',
    priceCents: 9900,
    active: true,
    createdAt: new Date(),
    ...overrides,
  })
}

function makeTenantBilling(
  overrides: Partial<Parameters<typeof TenantBilling.create>[0]> = {},
) {
  return TenantBilling.create({
    id: 'tb-1',
    tenantId: 'tenant-1',
    planId: 'plan-1',
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
}

function makeCheckoutInput(overrides = {}) {
  return {
    tenantId: 'tenant-1',
    planId: 'plan-1',
    name: 'Loja da Maria',
    cpfCnpj: '12345678909',
    ...overrides,
  }
}

describe('CreateCheckoutUseCase', () => {
  it('throws PlanNotFoundError when the plan does not exist', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
    }

    const usecase = new CreateCheckoutUseCase(
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    await expect(usecase.execute(makeCheckoutInput())).rejects.toThrow(
      PlanNotFoundError,
    )
  })

  it('throws PlanNotFoundError when the plan exists but is inactive', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan({ active: false })),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
    }

    const usecase = new CreateCheckoutUseCase(
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    await expect(usecase.execute(makeCheckoutInput())).rejects.toThrow(
      PlanNotFoundError,
    )
  })

  it('throws TenantBillingAlreadyActiveError when tenant billing is already active', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi
        .fn()
        .mockResolvedValue(makeTenantBilling({ status: 'active' })),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
      listPaymentsBySubscription: vi.fn().mockResolvedValue({ data: [] }),
    }

    const usecase = new CreateCheckoutUseCase(
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    await expect(usecase.execute(makeCheckoutInput())).rejects.toThrow(
      TenantBillingAlreadyActiveError,
    )
  })

  it('creates an Asaas customer, subscription, and a local inactive tenant billing row, returning the payment URL', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn().mockResolvedValue(makeTenantBilling()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
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
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    const result = await usecase.execute(makeCheckoutInput())

    expect(asaasClient.createCustomer).toHaveBeenCalledWith({
      name: 'Loja da Maria',
      cpfCnpj: '12345678909',
      externalReference: 'tenant-1',
    })
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        value: 99,
        cycle: 'MONTHLY',
      }),
    )
    expect(tenantBillingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
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
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn().mockResolvedValue(makeTenantBilling()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
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
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    await usecase.execute(makeCheckoutInput())

    expect(asaasClient.createCustomer).not.toHaveBeenCalled()
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    )
  })

  it('returns a null paymentUrl when Asaas has not generated a payment yet', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn().mockResolvedValue(makeTenantBilling()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
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
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    const result = await usecase.execute(makeCheckoutInput())

    expect(result).toEqual({ paymentUrl: null })
  })

  it('returns a null paymentUrl when Asaas throws while fetching payments', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
      create: vi.fn(),
      update: vi.fn(),
    }
    const tenantBillingRepository = {
      findByTenantId: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn().mockResolvedValue(makeTenantBilling()),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn().mockResolvedValue({ id: 'c1' }),
      createCustomer: vi.fn(),
      createSubscription: vi
        .fn()
        .mockResolvedValue({ id: 'asub_1', status: 'PENDING' }),
      listPaymentsBySubscription: vi
        .fn()
        .mockRejectedValue(new Error('Asaas is down')),
    }

    const usecase = new CreateCheckoutUseCase(
      tenantBillingRepository,
      saasPlanRepository,
      asaasClient as never,
    )

    const result = await usecase.execute(makeCheckoutInput())

    expect(result).toEqual({ paymentUrl: null })
  })

  it.each(['inactive', 'overdue', 'cancelled'] as const)(
    'updates the existing %s tenant billing row in place instead of inserting a duplicate',
    async (status) => {
      const saasPlanRepository = {
        list: vi.fn(),
        findById: vi.fn().mockResolvedValue(makePlan()),
        create: vi.fn(),
        update: vi.fn(),
      }
      const tenantBillingRepository = {
        findByTenantId: vi.fn().mockResolvedValue(
          makeTenantBilling({
            status,
            asaasCustomerId: 'cus_prior',
            asaasSubscriptionId: 'asub_old',
          }),
        ),
        findByAsaasSubscriptionId: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
        updateAsaasDetails: vi.fn().mockResolvedValue(makeTenantBilling()),
        list: vi.fn(),
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
        tenantBillingRepository,
        saasPlanRepository,
        asaasClient as never,
      )

      const result = await usecase.execute(makeCheckoutInput())

      expect(tenantBillingRepository.create).not.toHaveBeenCalled()
      expect(asaasClient.findCustomerByExternalReference).not.toHaveBeenCalled()
      expect(asaasClient.createCustomer).not.toHaveBeenCalled()
      expect(asaasClient.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_prior' }),
      )
      expect(tenantBillingRepository.updateAsaasDetails).toHaveBeenCalledWith(
        'tb-1',
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
