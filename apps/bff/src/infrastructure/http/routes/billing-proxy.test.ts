import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type BillingProxyDeps,
  registerBillingProxyRoutes,
} from './billing-proxy'

function buildTestApp(overrides: Partial<BillingProxyDeps> = {}) {
  const app = Fastify()
  const deps: BillingProxyDeps = {
    billingServiceUrl: 'http://localhost:3011',
    superAuthPreHandler: async (request: FastifyRequest) => {
      request.user = {
        uid: 'owner-uid-1',
        role: 'store_owner',
        tenant_id: 'tenant-1',
      }
    },
    requireOwner: async (request: FastifyRequest) => {
      request.user = {
        uid: 'owner-uid-1',
        role: 'store_owner',
        tenant_id: 'tenant-1',
      }
    },
    requireSuperAdmin: async (
      _request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      reply
        .status(403)
        .send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    },
    ...overrides,
  }
  return { app, deps }
}

describe('billing proxy routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards GET /v1/billing/plans to the billing service without x-tenant-id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => [{ id: 'plan-1', name: 'Basic', priceCents: 4900 }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerBillingProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/billing/plans',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3011/plans',
      expect.objectContaining({ method: 'GET' }),
    )
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers['x-tenant-id']).toBeUndefined()
    expect(response.statusCode).toBe(200)
  })

  it('forwards the Authorization header and body for POST /v1/billing/checkout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ id: 'tb-1', status: 'inactive' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerBillingProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/billing/checkout',
      headers: { authorization: 'Bearer token-123' },
      payload: { planId: 'plan-1', name: 'Loja', cpfCnpj: '12345678909' },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3011/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-123' }),
        body: JSON.stringify({
          planId: 'plan-1',
          name: 'Loja',
          cpfCnpj: '12345678909',
        }),
      }),
    )
    expect(response.statusCode).toBe(200)
  })

  it('rejects GET /v1/billing/tenants for non-super_admin callers with 403', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerBillingProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/billing/tenants',
    })

    expect(response.statusCode).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards GET /v1/billing/tenants for super_admin callers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ items: [], mrrCents: 0, overdueCount: 0 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp({
      superAuthPreHandler: async (request: FastifyRequest) => {
        request.user = { uid: 'super-1', role: 'super_admin', tenant_id: null }
      },
      requireSuperAdmin: async () => {},
    })
    await registerBillingProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/billing/tenants',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3011/tenants',
      expect.anything(),
    )
    expect(response.statusCode).toBe(200)
  })
})
