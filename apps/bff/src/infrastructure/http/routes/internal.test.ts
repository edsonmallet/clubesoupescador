import { registerErrorHandler } from '@clube/fastify-plugins'
import Fastify from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { UpdateTenantBillingUseCase } from '../../../application/tenants/update-tenant-billing.usecase'
import { Tenant } from '../../../domain/entities/tenant'
import { TenantNotFoundError } from '../../../domain/errors/tenant-not-found.error'

vi.mock('../../../shared/env', () => ({
  env: { INTERNAL_SERVICE_TOKEN: 'test-internal-token' },
}))

import { type InternalRouteDeps, registerInternalRoutes } from './internal'

function fakeTenant(): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: 'plan-pro',
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

async function buildTestApp(overrides: Partial<InternalRouteDeps> = {}) {
  const app = Fastify()
  await registerErrorHandler(app)

  const deps: InternalRouteDeps = {
    updateTenantBillingUseCase: {
      execute: vi.fn().mockResolvedValue(fakeTenant()),
    } as unknown as UpdateTenantBillingUseCase,
    ...overrides,
  }

  await registerInternalRoutes(app, deps)
  return { app, deps }
}

describe('PATCH /internal/tenants/:id/billing', () => {
  it('returns 200 and the updated tenant when the token and body are valid', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/tenants/tenant-1/billing',
      headers: { 'x-internal-token': 'test-internal-token' },
      payload: { status: 'active', planId: 'plan-pro' },
    })

    expect(response.statusCode).toBe(200)
    expect(deps.updateTenantBillingUseCase.execute).toHaveBeenCalledWith(
      'tenant-1',
      { status: 'active', planId: 'plan-pro' },
    )
    expect(response.json()).toEqual({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme',
      logoUrl: null,
      planId: 'plan-pro',
      status: 'active',
      ownerUid: 'owner-1',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('returns 401 when the x-internal-token header is wrong', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/tenants/tenant-1/billing',
      headers: { 'x-internal-token': 'wrong-token' },
      payload: { status: 'suspended' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('INVALID_INTERNAL_TOKEN')
    expect(deps.updateTenantBillingUseCase.execute).not.toHaveBeenCalled()
  })

  it('returns 401 when the x-internal-token header is missing', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/tenants/tenant-1/billing',
      payload: { status: 'suspended' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('INVALID_INTERNAL_TOKEN')
    expect(deps.updateTenantBillingUseCase.execute).not.toHaveBeenCalled()
  })

  it('returns 404 when the tenant id is unknown', async () => {
    const { app } = await buildTestApp({
      updateTenantBillingUseCase: {
        execute: vi.fn().mockRejectedValue(new TenantNotFoundError('missing')),
      } as unknown as UpdateTenantBillingUseCase,
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/tenants/missing/billing',
      headers: { 'x-internal-token': 'test-internal-token' },
      payload: { status: 'suspended' },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe('TENANT_NOT_FOUND')
  })
})
