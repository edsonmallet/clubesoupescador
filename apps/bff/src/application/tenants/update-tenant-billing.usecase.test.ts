import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { UpdateTenantBillingUseCase } from './update-tenant-billing.usecase'

function fakeTenant(
  overrides: Partial<{ status: 'active' | 'suspended'; planId: string | null }> = {},
): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: overrides.planId ?? null,
    status: overrides.status ?? 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('UpdateTenantBillingUseCase', () => {
  it('updates only the status when planId is not provided', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant()),
      updateStatus: vi.fn().mockResolvedValue(fakeTenant({ status: 'suspended' })),
      updatePlan: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new UpdateTenantBillingUseCase(repository)

    const result = await useCase.execute('tenant-1', { status: 'suspended' })

    expect(result.status).toBe('suspended')
    expect(repository.updateStatus).toHaveBeenCalledWith('tenant-1', 'suspended')
    expect(repository.updatePlan).not.toHaveBeenCalled()
  })

  it('updates status and plan when planId is provided', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant()),
      updateStatus: vi.fn().mockResolvedValue(fakeTenant({ status: 'active' })),
      updatePlan: vi.fn().mockResolvedValue(fakeTenant({ status: 'active', planId: 'plan-pro' })),
      countUsers: vi.fn(),
    }
    const useCase = new UpdateTenantBillingUseCase(repository)

    const result = await useCase.execute('tenant-1', {
      status: 'active',
      planId: 'plan-pro',
    })

    expect(result.planId).toBe('plan-pro')
    expect(repository.updateStatus).toHaveBeenCalledWith('tenant-1', 'active')
    expect(repository.updatePlan).toHaveBeenCalledWith('tenant-1', 'plan-pro')
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
    const useCase = new UpdateTenantBillingUseCase(repository)

    await expect(
      useCase.execute('missing', { status: 'suspended' }),
    ).rejects.toBeInstanceOf(TenantNotFoundError)
    expect(repository.updateStatus).not.toHaveBeenCalled()
    expect(repository.updatePlan).not.toHaveBeenCalled()
  })
})
