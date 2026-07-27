import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { GetTenantUseCase } from './get-tenant.usecase'

function fakeTenant(): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('GetTenantUseCase', () => {
  it('returns the tenant with its member count', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant()),
      updateStatus: vi.fn(),
      countUsers: vi.fn().mockResolvedValue(5),
    }
    const useCase = new GetTenantUseCase(repository)

    const result = await useCase.execute('tenant-1')

    expect(result.tenant.id).toBe('tenant-1')
    expect(result.memberCount).toBe(5)
  })

  it('throws TenantNotFoundError when the tenant does not exist', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new GetTenantUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      TenantNotFoundError,
    )
  })
})
