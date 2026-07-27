import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { plansService } from '../../services/plans.service'
import { usePlans } from '../usePlans'

vi.mock('../../services/plans.service', () => ({
  plansService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
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
  it('fetches plans via plansService.list', async () => {
    vi.mocked(plansService.list).mockResolvedValue([
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

    expect(plansService.list).toHaveBeenCalledOnce()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('Basic')
  })
})
