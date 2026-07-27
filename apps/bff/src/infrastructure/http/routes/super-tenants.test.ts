import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../../domain/entities/tenant'
import { TenantNotFoundError } from '../../../domain/errors/tenant-not-found.error'
import type { CreateTenantUseCase } from '../../../application/super-tenants/create-tenant.usecase'
import type { GetTenantUseCase } from '../../../application/super-tenants/get-tenant.usecase'
import type { ImpersonateTenantUseCase } from '../../../application/super-tenants/impersonate-tenant.usecase'
import type { ListTenantsUseCase } from '../../../application/super-tenants/list-tenants.usecase'
import type { UpdateTenantStatusUseCase } from '../../../application/super-tenants/update-tenant-status.usecase'
import { registerErrorHandler } from '@clube/fastify-plugins'
import { type SuperTenantsRouteDeps, registerSuperTenantsRoutes } from './super-tenants'

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

async function buildTestApp(overrides: Partial<SuperTenantsRouteDeps> = {}) {
  const app = Fastify()
  await registerErrorHandler(app)

  const deps: SuperTenantsRouteDeps = {
    superAuthPreHandler: async (request: FastifyRequest) => {
      request.user = { uid: 'super-admin-1', role: 'super_admin', tenant_id: null }
    },
    requireSuperAdmin: async () => {},
    listTenantsUseCase: {
      execute: vi.fn().mockResolvedValue([{ tenant: fakeTenant(), memberCount: 2 }]),
    } as unknown as ListTenantsUseCase,
    getTenantUseCase: {
      execute: vi.fn().mockResolvedValue({ tenant: fakeTenant(), memberCount: 2 }),
    } as unknown as GetTenantUseCase,
    createTenantUseCase: {
      execute: vi.fn().mockResolvedValue(fakeTenant()),
    } as unknown as CreateTenantUseCase,
    updateTenantStatusUseCase: {
      execute: vi.fn().mockResolvedValue(fakeTenant()),
    } as unknown as UpdateTenantStatusUseCase,
    impersonateTenantUseCase: {
      execute: vi.fn().mockResolvedValue({ token: 'tok', ownerUid: 'owner-1', slug: 'acme' }),
    } as unknown as ImpersonateTenantUseCase,
    ...overrides,
  }
  await registerSuperTenantsRoutes(app, deps)
  return { app, deps }
}

describe('super-tenants routes', () => {
  it('GET /v1/super/tenants returns the list with member counts', async () => {
    const { app } = await buildTestApp()

    const response = await app.inject({ method: 'GET', url: '/v1/super/tenants' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      { tenant: expect.objectContaining({ id: 'tenant-1' }), memberCount: 2 },
    ])
  })

  it('POST /v1/super/tenants creates a tenant', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/v1/super/tenants',
      payload: { slug: 'acme', name: 'Acme', ownerUid: 'owner-1' },
    })

    expect(response.statusCode).toBe(201)
    expect(deps.createTenantUseCase.execute).toHaveBeenCalledWith({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-1',
    })
  })

  it('PATCH /v1/super/tenants/:id/status returns 404 when the tenant is missing', async () => {
    const { app } = await buildTestApp({
      updateTenantStatusUseCase: {
        execute: vi.fn().mockRejectedValue(new TenantNotFoundError('tenant-1')),
      } as unknown as UpdateTenantStatusUseCase,
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/super/tenants/tenant-1/status',
      payload: { status: 'suspended' },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe('TENANT_NOT_FOUND')
  })

  it('POST /v1/super/tenants/:id/impersonate returns a custom token', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/v1/super/tenants/tenant-1/impersonate',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ token: 'tok', ownerUid: 'owner-1', slug: 'acme' })
    expect(deps.impersonateTenantUseCase.execute).toHaveBeenCalledWith(
      'tenant-1',
      'super-admin-1',
    )
  })

  it('rejects non-super_admin callers', async () => {
    const { app } = await buildTestApp({
      requireSuperAdmin: async (_request: FastifyRequest, reply: FastifyReply) => {
        reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
      },
    })

    const response = await app.inject({ method: 'GET', url: '/v1/super/tenants' })

    expect(response.statusCode).toBe(403)
  })
})
