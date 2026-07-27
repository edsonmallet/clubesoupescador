import Fastify from 'fastify'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../shared/env', () => ({
  env: { ASAAS_WEBHOOK_TOKEN: 'test-webhook-token' },
}))

import { type WebhookRouteDeps, registerWebhookRoutes } from './webhook'

async function buildTestApp(overrides: Partial<WebhookRouteDeps> = {}) {
  const app = Fastify()

  const deps: WebhookRouteDeps = {
    enqueueProcessWebhook: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  await registerWebhookRoutes(app, deps)
  return { app, deps }
}

describe('POST /webhook', () => {
  it('returns 401 when the asaas-access-token header is invalid', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'asaas-access-token': 'wrong-token' },
      payload: { id: 'evt_1', event: 'PAYMENT_CONFIRMED' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('INVALID_WEBHOOK_TOKEN')
    expect(deps.enqueueProcessWebhook).not.toHaveBeenCalled()
  })

  it('returns 401 when the asaas-access-token header is missing', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      payload: { id: 'evt_1', event: 'PAYMENT_CONFIRMED' },
    })

    expect(response.statusCode).toBe(401)
    expect(deps.enqueueProcessWebhook).not.toHaveBeenCalled()
  })

  it('responds 200 immediately and enqueues the event when the token is valid', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'asaas-access-token': 'test-webhook-token' },
      payload: { id: 'evt_1', event: 'PAYMENT_CONFIRMED' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ received: true })
    expect(deps.enqueueProcessWebhook).toHaveBeenCalledWith({
      id: 'evt_1',
      event: 'PAYMENT_CONFIRMED',
    })
  })

  it('still responds 200 when enqueueing fails, logging instead of propagating', async () => {
    const { app } = await buildTestApp({
      enqueueProcessWebhook: vi.fn().mockRejectedValue(new Error('redis down')),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'asaas-access-token': 'test-webhook-token' },
      payload: { id: 'evt_1', event: 'PAYMENT_CONFIRMED' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ received: true })
  })
})
