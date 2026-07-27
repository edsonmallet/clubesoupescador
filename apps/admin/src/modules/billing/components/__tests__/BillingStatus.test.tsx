import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { billingService } from '../../services/billing.service'
import { BillingStatus } from '../BillingStatus'

vi.mock('../../services/billing.service', () => ({
  billingService: {
    getMyBilling: vi.fn(),
    listPlans: vi.fn(),
    checkout: vi.fn(),
  },
}))

afterEach(cleanup)

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('BillingStatus', () => {
  it('shows a loading state initially', () => {
    vi.mocked(billingService.getMyBilling).mockReturnValue(
      new Promise(() => {}),
    )
    vi.mocked(billingService.listPlans).mockReturnValue(new Promise(() => {}))

    renderWithClient(<BillingStatus />)

    expect(screen.getByText('Carregando assinatura...')).toBeInTheDocument()
  })

  it('shows an error state when the billing query fails', async () => {
    vi.mocked(billingService.getMyBilling).mockRejectedValue(new Error('boom'))
    vi.mocked(billingService.listPlans).mockResolvedValue([])

    renderWithClient(<BillingStatus />)

    expect(
      await screen.findByText('Erro ao carregar sua assinatura.'),
    ).toBeInTheDocument()
  })

  it('shows the "never subscribed" state when getMyBilling resolves to null', async () => {
    vi.mocked(billingService.getMyBilling).mockResolvedValue(null)
    vi.mocked(billingService.listPlans).mockResolvedValue([])

    renderWithClient(<BillingStatus />)

    expect(
      await screen.findByText('Você ainda não assinou nenhum plano'),
    ).toBeInTheDocument()
  })

  it('shows the plan name and status badge when a billing record exists', async () => {
    vi.mocked(billingService.getMyBilling).mockResolvedValue({
      id: 'tb-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
      asaasCustomerId: 'cus-1',
      asaasSubscriptionId: 'sub-1',
      status: 'overdue',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Pro',
        priceCents: 9990,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    renderWithClient(<BillingStatus />)

    expect(await screen.findByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Inadimplente')).toBeInTheDocument()
  })

  it('falls back to the raw planId when the plan is not found in the plans list', async () => {
    vi.mocked(billingService.getMyBilling).mockResolvedValue({
      id: 'tb-1',
      tenantId: 'tenant-1',
      planId: 'plan-unknown',
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    vi.mocked(billingService.listPlans).mockResolvedValue([])

    renderWithClient(<BillingStatus />)

    expect(await screen.findByText('plan-unknown')).toBeInTheDocument()
  })
})
