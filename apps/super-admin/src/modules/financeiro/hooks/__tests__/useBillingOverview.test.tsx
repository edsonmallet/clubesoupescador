import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { financeiroService } from '../../services/financeiro.service'
import { useBillingOverview } from '../useBillingOverview'

vi.mock('../../services/financeiro.service', () => ({
  financeiroService: { getOverview: vi.fn() },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useBillingOverview', () => {
  it('fetches the billing overview via financeiroService.getOverview', async () => {
    vi.mocked(financeiroService.getOverview).mockResolvedValue({
      items: [
        {
          tenantId: 'tenant-1',
          planName: 'Basic',
          priceCents: 4990,
          status: 'overdue',
        },
      ],
      mrrCents: 0,
      overdueCount: 1,
    })

    const { result } = renderHook(() => useBillingOverview(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(financeiroService.getOverview).toHaveBeenCalledOnce()
    expect(result.current.data?.overdueCount).toBe(1)
    expect(result.current.data?.items[0].status).toBe('overdue')
  })
})
