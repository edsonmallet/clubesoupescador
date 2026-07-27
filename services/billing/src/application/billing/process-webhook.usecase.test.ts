import { describe, expect, it, vi } from 'vitest'
import { TenantBilling } from '../../domain/entities/tenant-billing'
import {
  ProcessWebhookUseCase,
  extractAsaasSubscriptionId,
} from './process-webhook.usecase'

function makeTenantBilling(
  overrides: Partial<Parameters<typeof TenantBilling.create>[0]> = {},
) {
  return TenantBilling.create({
    id: 'tb-1',
    tenantId: 'tenant-1',
    planId: 'plan-1',
    asaasCustomerId: 'cus_1',
    asaasSubscriptionId: 'asub_1',
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
}

function makeRepository(overrides = {}) {
  return {
    findByTenantId: vi.fn(),
    findByAsaasSubscriptionId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updateAsaasDetails: vi.fn(),
    list: vi.fn(),
    ...overrides,
  }
}

describe('extractAsaasSubscriptionId', () => {
  it('reads the subscription id from a payment event', () => {
    expect(
      extractAsaasSubscriptionId({
        event: 'PAYMENT_CONFIRMED',
        payment: { subscription: 'asub_1' },
      }),
    ).toBe('asub_1')
  })

  it('reads the subscription id from a string subscription field', () => {
    expect(
      extractAsaasSubscriptionId({
        event: 'SUBSCRIPTION_DELETED',
        subscription: 'asub_2',
      }),
    ).toBe('asub_2')
  })

  it('reads the subscription id from a subscription object', () => {
    expect(
      extractAsaasSubscriptionId({
        event: 'SUBSCRIPTION_DELETED',
        subscription: { id: 'asub_3' },
      }),
    ).toBe('asub_3')
  })

  it('returns null when neither field is present', () => {
    expect(
      extractAsaasSubscriptionId({ event: 'ACCOUNT_STATUS_UPDATED' }),
    ).toBeNull()
  })
})

describe('ProcessWebhookUseCase', () => {
  it('is a no-op for an event without a resolvable subscription id', async () => {
    const tenantBillingRepository = makeRepository()
    const bffClient = { updateTenantBilling: vi.fn() }

    const usecase = new ProcessWebhookUseCase(
      tenantBillingRepository,
      bffClient,
    )
    await usecase.execute({ event: 'ACCOUNT_STATUS_UPDATED' })

    expect(
      tenantBillingRepository.findByAsaasSubscriptionId,
    ).not.toHaveBeenCalled()
    expect(bffClient.updateTenantBilling).not.toHaveBeenCalled()
  })

  it('is a no-op when no tenant billing matches the subscription id', async () => {
    const tenantBillingRepository = makeRepository({
      findByAsaasSubscriptionId: vi.fn().mockResolvedValue(null),
    })
    const bffClient = { updateTenantBilling: vi.fn() }

    const usecase = new ProcessWebhookUseCase(
      tenantBillingRepository,
      bffClient,
    )
    await usecase.execute({
      event: 'PAYMENT_CONFIRMED',
      payment: { subscription: 'does-not-exist' },
    })

    expect(tenantBillingRepository.updateStatus).not.toHaveBeenCalled()
    expect(bffClient.updateTenantBilling).not.toHaveBeenCalled()
  })

  it('activates the tenant billing and notifies the BFF on PAYMENT_CONFIRMED', async () => {
    const tenantBilling = makeTenantBilling()
    const tenantBillingRepository = makeRepository({
      findByAsaasSubscriptionId: vi.fn().mockResolvedValue(tenantBilling),
    })
    const bffClient = { updateTenantBilling: vi.fn() }

    const usecase = new ProcessWebhookUseCase(
      tenantBillingRepository,
      bffClient,
    )
    await usecase.execute({
      event: 'PAYMENT_CONFIRMED',
      payment: { subscription: 'asub_1' },
    })

    expect(tenantBillingRepository.updateStatus).toHaveBeenCalledWith(
      'tb-1',
      'active',
    )
    expect(bffClient.updateTenantBilling).toHaveBeenCalledWith('tenant-1', {
      status: 'active',
      planId: 'plan-1',
    })
  })

  it('marks the tenant billing overdue and does NOT notify the BFF on PAYMENT_OVERDUE', async () => {
    const tenantBilling = makeTenantBilling({ status: 'active' })
    const tenantBillingRepository = makeRepository({
      findByAsaasSubscriptionId: vi.fn().mockResolvedValue(tenantBilling),
    })
    const bffClient = { updateTenantBilling: vi.fn() }

    const usecase = new ProcessWebhookUseCase(
      tenantBillingRepository,
      bffClient,
    )
    await usecase.execute({
      event: 'PAYMENT_OVERDUE',
      payment: { subscription: 'asub_1' },
    })

    expect(tenantBillingRepository.updateStatus).toHaveBeenCalledWith(
      'tb-1',
      'overdue',
    )
    expect(bffClient.updateTenantBilling).not.toHaveBeenCalled()
  })

  it.each([
    'SUBSCRIPTION_DELETED',
    'SUBSCRIPTION_INACTIVATED',
    'SUBSCRIPTION_CANCELLED',
  ])(
    'cancels the tenant billing and notifies the BFF to suspend on %s',
    async (event) => {
      const tenantBilling = makeTenantBilling({ status: 'active' })
      const tenantBillingRepository = makeRepository({
        findByAsaasSubscriptionId: vi.fn().mockResolvedValue(tenantBilling),
      })
      const bffClient = { updateTenantBilling: vi.fn() }

      const usecase = new ProcessWebhookUseCase(
        tenantBillingRepository,
        bffClient,
      )
      await usecase.execute({
        event,
        subscription: { id: 'asub_1' },
      })

      expect(tenantBillingRepository.updateStatus).toHaveBeenCalledWith(
        'tb-1',
        'cancelled',
      )
      expect(bffClient.updateTenantBilling).toHaveBeenCalledWith('tenant-1', {
        status: 'suspended',
      })
    },
  )

  it('is a no-op for an unrelated event once a tenant billing is found', async () => {
    const tenantBilling = makeTenantBilling()
    const tenantBillingRepository = makeRepository({
      findByAsaasSubscriptionId: vi.fn().mockResolvedValue(tenantBilling),
    })
    const bffClient = { updateTenantBilling: vi.fn() }

    const usecase = new ProcessWebhookUseCase(
      tenantBillingRepository,
      bffClient,
    )
    await usecase.execute({
      event: 'ACCOUNT_STATUS_UPDATED',
      payment: { subscription: 'asub_1' },
    })

    expect(tenantBillingRepository.updateStatus).not.toHaveBeenCalled()
    expect(bffClient.updateTenantBilling).not.toHaveBeenCalled()
  })
})
