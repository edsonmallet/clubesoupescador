import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { UpdateTenantStatusUseCase } from './update-tenant-status.usecase'

function fakeTenant(status: 'active' | 'suspended' = 'active'): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status,
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('UpdateTenantStatusUseCase', () => {
  it('updates the status of an existing tenant', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant('active')),
      updateStatus: vi.fn().mockResolvedValue(fakeTenant('suspended')),
      updatePlan: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new UpdateTenantStatusUseCase(repository)

    const result = await useCase.execute('tenant-1', 'suspended')

    expect(result.status).toBe('suspended')
    expect(repository.updateStatus).toHaveBeenCalledWith(
      'tenant-1',
      'suspended',
    )
  })

  it('throws TenantNotFoundError when the tenant does not exist', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      updatePlan: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new UpdateTenantStatusUseCase(repository)

    await expect(
      useCase.execute('missing', 'suspended'),
    ).rejects.toBeInstanceOf(TenantNotFoundError)
    expect(repository.updateStatus).not.toHaveBeenCalled()
  })
})
