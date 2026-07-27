import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { billingService } from '../../services/billing.service'
import { usePlans } from '../usePlans'

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

describe('usePlans', () => {
  it('fetches plans via billingService.listPlans', async () => {
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Basic',
        priceCents: 4990,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => usePlans(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(billingService.listPlans).toHaveBeenCalledOnce()
    expect(result.current.data?.[0].name).toBe('Basic')
  })
})
