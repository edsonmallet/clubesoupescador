import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createCustomToken, getAuth, getFirebaseApp } = vi.hoisted(() => ({
  createCustomToken: vi.fn().mockResolvedValue('custom-token-123'),
  getAuth: vi.fn(),
  getFirebaseApp: vi.fn().mockReturnValue({}),
}))
getAuth.mockReturnValue({ createCustomToken })
vi.mock('firebase-admin/auth', () => ({ getAuth }))
vi.mock('@clube/firebase-utils', () => ({ getFirebaseApp }))

import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { ImpersonateTenantUseCase } from './impersonate-tenant.usecase'

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

describe('ImpersonateTenantUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createCustomToken.mockResolvedValue('custom-token-123')
    getAuth.mockReturnValue({ createCustomToken })
  })

  it('mints a custom token for the tenant owner', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant()),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new ImpersonateTenantUseCase(repository)

    const result = await useCase.execute('tenant-1', 'super-admin-uid')

    expect(result).toEqual({ token: 'custom-token-123', ownerUid: 'owner-1', slug: 'acme' })
    expect(createCustomToken).toHaveBeenCalledWith('owner-1', {
      impersonated_by: 'super-admin-uid',
    })
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
    const useCase = new ImpersonateTenantUseCase(repository)

    await expect(useCase.execute('missing', 'super-admin-uid')).rejects.toBeInstanceOf(
      TenantNotFoundError,
    )
    expect(createCustomToken).not.toHaveBeenCalled()
  })
})
