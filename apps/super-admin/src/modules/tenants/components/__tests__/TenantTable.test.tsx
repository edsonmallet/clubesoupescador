import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { tenantsService } from '../../services/tenants.service'
import { TenantTable } from '../TenantTable'

vi.mock('../../services/tenants.service', () => ({
  tenantsService: { list: vi.fn() },
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('TenantTable', () => {
  it('renders tenant rows with status, plan, members and a receita placeholder', async () => {
    vi.mocked(tenantsService.list).mockResolvedValue([
      {
        tenant: {
          id: 'tenant-1',
          slug: 'acme',
          name: 'Acme',
          logoUrl: null,
          planId: null,
          status: 'active',
          ownerUid: 'owner-1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        memberCount: 4,
      },
    ])

    renderWithClient(<TenantTable />)

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
