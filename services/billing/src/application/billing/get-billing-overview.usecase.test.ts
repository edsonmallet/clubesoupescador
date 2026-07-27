import { describe, expect, it, vi } from 'vitest'
import { SaasPlan } from '../../domain/entities/saas-plan'
import { TenantBilling } from '../../domain/entities/tenant-billing'
import { GetBillingOverviewUseCase } from './get-billing-overview.usecase'

function makePlan(overrides: Partial<Parameters<typeof SaasPlan.create>[0]> = {}) {
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

describe('GetBillingOverviewUseCase', () => {
  it('joins tenant billing rows with their plan and computes mrr/overdue summary', async () => {
    const tenantBillingRepository = {
      findByTenantId: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn().mockResolvedValue([
        makeTenantBilling({
          id: 'tb-1',
          tenantId: 'tenant-1',
          planId: 'plan-1',
          status: 'active',
        }),
        makeTenantBilling({
          id: 'tb-2',
          tenantId: 'tenant-2',
          planId: 'plan-2',
          status: 'overdue',
        }),
        makeTenantBilling({
          id: 'tb-3',
          tenantId: 'tenant-3',
          planId: 'plan-1',
          status: 'cancelled',
        }),
      ]),
    }
    const saasPlanRepository = {
      list: vi.fn().mockResolvedValue([
        makePlan({ id: 'plan-1', name: 'Starter', priceCents: 9900 }),
        makePlan({ id: 'plan-2', name: 'Pro', priceCents: 19900 }),
      ]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }

    const usecase = new GetBillingOverviewUseCase(
      tenantBillingRepository,
      saasPlanRepository,
    )
    const result = await usecase.execute()

    expect(result.items).toEqual([
      { tenantId: 'tenant-1', planName: 'Starter', priceCents: 9900, status: 'active' },
      { tenantId: 'tenant-2', planName: 'Pro', priceCents: 19900, status: 'overdue' },
      { tenantId: 'tenant-3', planName: 'Starter', priceCents: 9900, status: 'cancelled' },
    ])
    expect(result.summary).toEqual({ mrrCents: 9900, overdueCount: 1 })
  })

  it('falls back to a placeholder plan name when the plan is missing', async () => {
    const tenantBillingRepository = {
      findByTenantId: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi
        .fn()
        .mockResolvedValue([
          makeTenantBilling({ planId: 'missing-plan', status: 'active' }),
        ]),
    }
    const saasPlanRepository = {
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }

    const usecase = new GetBillingOverviewUseCase(
      tenantBillingRepository,
      saasPlanRepository,
    )
    const result = await usecase.execute()

    expect(result.items[0]).toEqual({
      tenantId: 'tenant-1',
      planName: 'unknown',
      priceCents: 0,
      status: 'active',
    })
    expect(result.summary).toEqual({ mrrCents: 0, overdueCount: 0 })
  })

  it('returns an empty overview when there are no tenant billings', async () => {
    const tenantBillingRepository = {
      findByTenantId: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateAsaasDetails: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
    }
    const saasPlanRepository = {
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }

    const usecase = new GetBillingOverviewUseCase(
      tenantBillingRepository,
      saasPlanRepository,
    )
    const result = await usecase.execute()

    expect(result).toEqual({ items: [], summary: { mrrCents: 0, overdueCount: 0 } })
  })
})
