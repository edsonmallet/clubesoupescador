import { ApiError, apiClient } from '@/shared/services/api-client'
import { describe, expect, it, vi } from 'vitest'
import { billingService } from '../billing.service'

vi.mock('@/shared/services/api-client', async () => {
  const actual = await vi.importActual<
    typeof import('@/shared/services/api-client')
  >('@/shared/services/api-client')
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  }
})

describe('billingService.getMyBilling', () => {
  it('returns the billing record on success', async () => {
    const record = {
      id: 'tb-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      status: 'active' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(apiClient.get).mockResolvedValue(record)

    const result = await billingService.getMyBilling()

    expect(result).toEqual(record)
  })

  it('maps a 404 ApiError to null instead of throwing (tenant never subscribed)', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      new ApiError(
        404,
        'TENANT_BILLING_NOT_FOUND',
        'Tenant never subscribed to a billing plan',
      ),
    )

    const result = await billingService.getMyBilling()

    expect(result).toBeNull()
  })

  it('rethrows non-404 errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      new ApiError(500, 'UNKNOWN', 'boom'),
    )

    await expect(billingService.getMyBilling()).rejects.toThrow('boom')
  })
})
