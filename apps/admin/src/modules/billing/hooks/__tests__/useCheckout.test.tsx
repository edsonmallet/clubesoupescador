import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { billingService } from '../../services/billing.service'
import { useCheckout } from '../useCheckout'

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

const originalLocation = window.location

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  })
  vi.mocked(billingService.checkout).mockReset()
})

describe('useCheckout', () => {
  it('redirects to the returned paymentUrl on success', async () => {
    vi.mocked(billingService.checkout).mockResolvedValue({
      id: 'tb-1',
      status: 'inactive',
      paymentUrl: 'https://sandbox.asaas.com/checkout/abc',
    })

    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    result.current.mutate({
      planId: 'plan-1',
      name: 'Loja',
      cpfCnpj: '12345678909',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(window.location.href).toBe('https://sandbox.asaas.com/checkout/abc')
  })

  it('does not redirect when paymentUrl is null, so the caller can surface an error', async () => {
    vi.mocked(billingService.checkout).mockResolvedValue({
      id: 'tb-1',
      status: 'inactive',
      paymentUrl: null,
    })

    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        href: 'https://admin.acme.clube.com.br/assinatura',
      },
      writable: true,
    })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    result.current.mutate({
      planId: 'plan-1',
      name: 'Loja',
      cpfCnpj: '12345678909',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(window.location.href).toBe(
      'https://admin.acme.clube.com.br/assinatura',
    )
    expect(result.current.data?.paymentUrl).toBeNull()
  })
})
