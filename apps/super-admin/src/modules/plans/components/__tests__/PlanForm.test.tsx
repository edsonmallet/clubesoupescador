import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { plansService } from '../../services/plans.service'
import type { SaasPlan } from '../../types/plan'
import { PlanForm } from '../PlanForm'

vi.mock('../../services/plans.service', () => ({
  plansService: { create: vi.fn(), update: vi.fn() },
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

describe('PlanForm', () => {
  beforeEach(() => {
    vi.mocked(plansService.create).mockReset()
    vi.mocked(plansService.update).mockReset()
  })

  it('shows validation errors for an empty submit (create mode)', async () => {
    const user = userEvent.setup()
    renderWithClient(<PlanForm />)

    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    expect(
      await screen.findByText('Informe o nome do plano'),
    ).toBeInTheDocument()
    expect(plansService.create).not.toHaveBeenCalled()
  })

  it('rejects a non-positive priceCents', async () => {
    const user = userEvent.setup()
    renderWithClient(<PlanForm />)

    await user.type(screen.getByLabelText('Nome do plano'), 'Basic')
    await user.clear(screen.getByLabelText('Preço (em centavos)'))
    await user.type(screen.getByLabelText('Preço (em centavos)'), '0')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    expect(
      await screen.findByText('Informe um preço maior que zero'),
    ).toBeInTheDocument()
    expect(plansService.create).not.toHaveBeenCalled()
  })

  it('calls plansService.create with parsed values on valid submit', async () => {
    const user = userEvent.setup()
    vi.mocked(plansService.create).mockResolvedValue({
      id: 'plan-1',
      name: 'Basic',
      priceCents: 4990,
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    renderWithClient(<PlanForm />)

    await user.type(screen.getByLabelText('Nome do plano'), 'Basic')
    await user.clear(screen.getByLabelText('Preço (em centavos)'))
    await user.type(screen.getByLabelText('Preço (em centavos)'), '4990')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    await waitFor(() => {
      expect(plansService.create).toHaveBeenCalledWith({
        name: 'Basic',
        priceCents: 4990,
        active: true,
      })
    })
  })

  it('pre-fills fields and calls plansService.update in edit mode', async () => {
    const user = userEvent.setup()
    const plan: SaasPlan = {
      id: 'plan-1',
      name: 'Basic',
      priceCents: 4990,
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(plansService.update).mockResolvedValue(plan)

    renderWithClient(<PlanForm plan={plan} />)

    expect(screen.getByLabelText('Nome do plano')).toHaveValue('Basic')
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' }),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Nome do plano'))
    await user.type(screen.getByLabelText('Nome do plano'), 'Basic Plus')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => {
      expect(plansService.update).toHaveBeenCalledWith('plan-1', {
        name: 'Basic Plus',
        priceCents: 4990,
        active: true,
      })
    })
    expect(plansService.create).not.toHaveBeenCalled()
  })
})
