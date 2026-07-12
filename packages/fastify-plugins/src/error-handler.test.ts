import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerErrorHandler } from './error-handler'

describe('registerErrorHandler', () => {
  it('formats a domain-shaped error', async () => {
    const app = Fastify({ logger: false })
    await registerErrorHandler(app)
    app.get('/boom', async () => {
      throw {
        code: 'OFFER_NOT_FOUND',
        statusCode: 404,
        message: 'Offer not found',
      }
    })

    const response = await app.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      error: { code: 'OFFER_NOT_FOUND', message: 'Offer not found' },
    })
  })

  it('falls back to a generic 500 for unknown errors', async () => {
    const app = Fastify({ logger: false })
    await registerErrorHandler(app)
    app.get('/boom', async () => {
      throw new Error('unexpected')
    })

    const response = await app.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' },
    })
  })
})
