import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { billingService } from '../../services/billing.service'
import { useMyBilling } from '../useMyBilling'

vi.mock('../../services/billing.service', () => ({
  billingService: {
    getMyBilling: vi.fn(),
    listPlans: vi.fn(),
    checkout: vi.fn(),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useMyBilling', () => {
  it('returns the tenant billing record when it exists', async () => {
    vi.mocked(billingService.getMyBilling).mockResolvedValue({
      id: 'tb-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
      asaasCustomerId: 'cus-1',
      asaasSubscriptionId: 'sub-1',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    const { result } = renderHook(() => useMyBilling(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.status).toBe('active')
  })

  it('resolves to null when the tenant never subscribed (service already maps the 404)', async () => {
    vi.mocked(billingService.getMyBilling).mockResolvedValue(null)

    const { result } = renderHook(() => useMyBilling(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })
})
