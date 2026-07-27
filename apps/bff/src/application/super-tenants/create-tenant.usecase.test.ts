import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setRole } = vi.hoisted(() => ({ setRole: vi.fn() }))
vi.mock('@clube/firebase-utils', () => ({ setRole }))

import { Tenant } from '../../domain/entities/tenant'
import { SlugAlreadyTakenError } from '../../domain/errors/slug-already-taken.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { CreateTenantUseCase } from './create-tenant.usecase'

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

describe('CreateTenantUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the tenant, registers the owner user and sets the Firebase role', async () => {
    const tenantRepository: ITenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
      findByDomain: vi.fn(),
      create: vi.fn().mockResolvedValue(fakeTenant()),
      list: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const userRepository: IUserRepository = {
      findByUid: vi.fn(),
      create: vi.fn().mockResolvedValue({}),
    }
    const useCase = new CreateTenantUseCase(tenantRepository, userRepository)

    const tenant = await useCase.execute({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-1',
    })

    expect(tenant.id).toBe('tenant-1')
    expect(tenantRepository.create).toHaveBeenCalledWith({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-1',
      logoUrl: null,
    })
    expect(userRepository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'owner-1',
      role: 'store_owner',
    })
    expect(setRole).toHaveBeenCalledWith('owner-1', 'store_owner', 'tenant-1')
  })

  it('throws SlugAlreadyTakenError when the slug is already in use', async () => {
    const tenantRepository: ITenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(fakeTenant()),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const userRepository: IUserRepository = {
      findByUid: vi.fn(),
      create: vi.fn(),
    }
    const useCase = new CreateTenantUseCase(tenantRepository, userRepository)

    await expect(
      useCase.execute({ slug: 'acme', name: 'Acme', ownerUid: 'owner-1' }),
    ).rejects.toBeInstanceOf(SlugAlreadyTakenError)
    expect(tenantRepository.create).not.toHaveBeenCalled()
    expect(setRole).not.toHaveBeenCalled()
  })
})
