import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import type { TenantStatus } from '../../domain/entities/tenant'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { createResolveTenant } from './proxy'

function fakeTenant(
  id: string,
  slug: string,
  status: TenantStatus = 'active',
): Tenant {
  return Tenant.create({
    id,
    slug,
    name: 'Fake Tenant',
    logoUrl: null,
    planId: null,
    status,
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

function fakeRepository(overrides: Partial<ITenantRepository> = {}) {
  return {
    findBySlug: vi.fn().mockResolvedValue(null),
    findByDomain: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    ...overrides,
  } as ITenantRepository
}

describe('createResolveTenant', () => {
  it('resolves by bare slug (x-tenant-slug header case)', async () => {
    const repository = fakeRepository({
      findBySlug: vi.fn().mockResolvedValue(fakeTenant('tenant-1', 'dev')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('dev')

    expect(tenant).toEqual({ id: 'tenant-1', slug: 'dev' })
    expect(repository.findBySlug).toHaveBeenCalledWith('dev')
  })

  it('resolves by subdomain host, stripping the platform suffix', async () => {
    const repository = fakeRepository({
      findBySlug: vi.fn().mockResolvedValue(fakeTenant('tenant-1', 'acme')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('acme.clube.com.br')

    expect(tenant).toEqual({ id: 'tenant-1', slug: 'acme' })
    expect(repository.findBySlug).toHaveBeenCalledWith('acme')
  })

  it('treats a non-active tenant as not found', async () => {
    const repository = fakeRepository({
      findBySlug: vi
        .fn()
        .mockResolvedValue(fakeTenant('tenant-1', 'suspended-co', 'suspended')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('suspended-co')

    expect(tenant).toBeNull()
  })

  it('falls back to a custom domain lookup when no slug matches', async () => {
    const repository = fakeRepository({
      findByDomain: vi.fn().mockResolvedValue(fakeTenant('tenant-1', 'acme')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('www.acme.com.br')

    expect(tenant).toEqual({ id: 'tenant-1', slug: 'acme' })
    expect(repository.findByDomain).toHaveBeenCalledWith('www.acme.com.br')
  })

  it('returns null when nothing matches', async () => {
    const repository = fakeRepository()
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('unknown.com.br')

    expect(tenant).toBeNull()
  })
})
