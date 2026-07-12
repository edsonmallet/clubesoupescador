import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerHealth } from './health'

describe('registerHealth', () => {
  it('responds ok on GET /health', async () => {
    const app = Fastify()
    await registerHealth(app)

    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
