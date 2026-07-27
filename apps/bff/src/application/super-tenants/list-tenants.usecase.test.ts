import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { ListTenantsUseCase } from './list-tenants.usecase'

function fakeTenant(id: string, slug: string): Tenant {
  return Tenant.create({
    id,
    slug,
    name: `Tenant ${slug}`,
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: `owner-${slug}`,
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('ListTenantsUseCase', () => {
  it('returns tenants with their member counts', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn().mockResolvedValue([fakeTenant('t1', 'acme'), fakeTenant('t2', 'beta')]),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      countUsers: vi.fn().mockImplementation((id: string) => Promise.resolve(id === 't1' ? 3 : 0)),
    }
    const useCase = new ListTenantsUseCase(repository)

    const result = await useCase.execute()

    expect(result).toEqual([
      { tenant: expect.objectContaining({ id: 't1' }), memberCount: 3 },
      { tenant: expect.objectContaining({ id: 't2' }), memberCount: 0 },
    ])
  })
})
