import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerCors } from './cors'

describe('registerCors', () => {
  it('sets access-control-allow-origin header', async () => {
    const app = Fastify()
    await registerCors(app)
    app.get('/ping', async () => ({ pong: true }))

    const response = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: 'https://soupescador.clube.com.br' },
    })

    expect(response.headers['access-control-allow-origin']).toBe(
      'https://soupescador.clube.com.br',
    )
  })
})
