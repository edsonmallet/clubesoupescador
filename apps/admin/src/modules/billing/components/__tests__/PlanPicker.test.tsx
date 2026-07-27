import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { billingService } from '../../services/billing.service'
import { PlanPicker } from '../PlanPicker'

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

describe('PlanPicker', () => {
  it('shows a loading state initially', () => {
    vi.mocked(billingService.listPlans).mockReturnValue(new Promise(() => {}))

    renderWithClient(<PlanPicker />)

    expect(screen.getByText('Carregando planos...')).toBeInTheDocument()
  })

  it('shows an error state when the plans query fails', async () => {
    vi.mocked(billingService.listPlans).mockRejectedValue(new Error('boom'))

    renderWithClient(<PlanPicker />)

    expect(
      await screen.findByText('Erro ao carregar planos.'),
    ).toBeInTheDocument()
  })

  it('shows an empty state when there are no active plans', async () => {
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Legacy',
        priceCents: 1000,
        active: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    renderWithClient(<PlanPicker />)

    expect(
      await screen.findByText('Nenhum plano disponível no momento.'),
    ).toBeInTheDocument()
  })

  it('lists only active plans with their price', async () => {
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Basic',
        priceCents: 4990,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'plan-2',
        name: 'Legacy',
        priceCents: 1000,
        active: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    renderWithClient(<PlanPicker />)

    expect(await screen.findByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('R$ 49,90/mês')).toBeInTheDocument()
    expect(screen.queryByText('Legacy')).not.toBeInTheDocument()
  })

  it('validates the checkout form and submits with planId, name and cpfCnpj', async () => {
    const user = userEvent.setup()
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Basic',
        priceCents: 4990,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    vi.mocked(billingService.checkout).mockResolvedValue({
      id: 'tb-1',
      status: 'inactive',
      paymentUrl: 'https://sandbox.asaas.com/checkout/abc',
    })

    renderWithClient(<PlanPicker />)

    await user.click(await screen.findByRole('button', { name: 'Assinar' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirmar assinatura' }),
    )

    expect(
      await screen.findByText('Informe o nome do responsável'),
    ).toBeInTheDocument()
    expect(billingService.checkout).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Nome do responsável'), 'Loja do Zé')
    await user.type(screen.getByLabelText('CPF ou CNPJ'), '12345678909')
    await user.click(
      screen.getByRole('button', { name: 'Confirmar assinatura' }),
    )

    await waitFor(() => {
      expect(billingService.checkout).toHaveBeenCalledWith({
        planId: 'plan-1',
        name: 'Loja do Zé',
        cpfCnpj: '12345678909',
      })
    })
  })

  it('shows an error message when checkout succeeds but paymentUrl is null', async () => {
    const user = userEvent.setup()
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Basic',
        priceCents: 4990,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    vi.mocked(billingService.checkout).mockResolvedValue({
      id: 'tb-1',
      status: 'inactive',
      paymentUrl: null,
    })

    renderWithClient(<PlanPicker />)

    await user.click(await screen.findByRole('button', { name: 'Assinar' }))
    await user.type(screen.getByLabelText('Nome do responsável'), 'Loja do Zé')
    await user.type(screen.getByLabelText('CPF ou CNPJ'), '12345678909')
    await user.click(
      screen.getByRole('button', { name: 'Confirmar assinatura' }),
    )

    expect(
      await screen.findByText(
        'A assinatura foi criada, mas não foi possível gerar o link de pagamento. Acesse novamente esta página em instantes ou contate o suporte.',
      ),
    ).toBeInTheDocument()
  })

  it('shows an error message when the checkout mutation fails', async () => {
    const user = userEvent.setup()
    vi.mocked(billingService.listPlans).mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Basic',
        priceCents: 4990,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    vi.mocked(billingService.checkout).mockRejectedValue(new Error('boom'))

    renderWithClient(<PlanPicker />)

    await user.click(await screen.findByRole('button', { name: 'Assinar' }))
    await user.type(screen.getByLabelText('Nome do responsável'), 'Loja do Zé')
    await user.type(screen.getByLabelText('CPF ou CNPJ'), '12345678909')
    await user.click(
      screen.getByRole('button', { name: 'Confirmar assinatura' }),
    )

    expect(
      await screen.findByText(
        'Não foi possível iniciar a assinatura. Tente novamente.',
      ),
    ).toBeInTheDocument()
  })
})
