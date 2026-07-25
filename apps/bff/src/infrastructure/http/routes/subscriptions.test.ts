import Fastify, { type FastifyRequest } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type SubscriptionsProxyDeps,
  registerSubscriptionsProxyRoutes,
} from './subscriptions'

function buildTestApp(overrides: Partial<SubscriptionsProxyDeps> = {}) {
  const app = Fastify()
  const deps: SubscriptionsProxyDeps = {
    subscriptionsServiceUrl: 'http://localhost:3005',
    tenantAuthPreHandler: async (request: FastifyRequest) => {
      request.tenant = { id: 'tenant-1', slug: 'dev' }
    },
    requireAuth: async (request: FastifyRequest) => {
      request.user = {
        uid: 'firebase-uid-1',
        role: 'subscriber',
        tenant_id: 'tenant-1',
      }
    },
    ...overrides,
  }
  return { app, deps }
}

describe('subscriptions proxy routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards GET /v1/subscriptions/plans to the subscriptions service with x-tenant-id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => [{ id: 'plan-1', name: 'Mensal', priceCents: 1990 }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/subscriptions/plans',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3005/plans',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-tenant-id': 'tenant-1' }),
      }),
    )
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      { id: 'plan-1', name: 'Mensal', priceCents: 1990 },
    ])
  })

  it('forwards the Authorization header and body for POST /v1/subscriptions/checkout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ paymentUrl: 'https://pay.asaas.com/x' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/checkout',
      headers: { authorization: 'Bearer token-123' },
      payload: { planId: 'plan-1' },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3005/subscriptions/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer token-123',
          'content-type': 'application/json',
        }),
        body: JSON.stringify({ planId: 'plan-1' }),
      }),
    )
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ paymentUrl: 'https://pay.asaas.com/x' })
  })

  it('does not forward the request when requireAuth rejects it', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp({
      requireAuth: async (_request, reply) => {
        reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          },
        })
      },
    })
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/subscriptions/me',
    })

    expect(response.statusCode).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards POST /v1/subscriptions/webhook without requiring tenant/auth preHandlers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ received: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/webhook',
      headers: { 'asaas-access-token': 'webhook-token' },
      payload: {
        event: 'PAYMENT_CONFIRMED',
        payment: { subscription: 'asub_1' },
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3005/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'asaas-access-token': 'webhook-token',
        }),
      }),
    )
    expect(response.statusCode).toBe(200)
  })
})
