import { describe, expect, it } from 'vitest'
import { Tenant } from './tenant'

describe('Tenant', () => {
  it('exposes all props through getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const tenant = Tenant.create({
      id: 'tenant-1',
      slug: 'dev',
      name: 'Dev Tenant',
      logoUrl: null,
      planId: null,
      status: 'active',
      ownerUid: 'owner-1',
      settings: { theme: 'default' },
      createdAt,
    })

    expect(tenant.id).toBe('tenant-1')
    expect(tenant.slug).toBe('dev')
    expect(tenant.name).toBe('Dev Tenant')
    expect(tenant.logoUrl).toBeNull()
    expect(tenant.planId).toBeNull()
    expect(tenant.status).toBe('active')
    expect(tenant.ownerUid).toBe('owner-1')
    expect(tenant.settings).toEqual({ theme: 'default' })
    expect(tenant.createdAt).toBe(createdAt)
  })
})
