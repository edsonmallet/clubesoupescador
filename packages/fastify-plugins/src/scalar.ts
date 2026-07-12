import swagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import type { FastifyInstance } from 'fastify'

export async function registerScalar(
  app: FastifyInstance,
  title: string,
): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: { title, version: '0.0.0' },
    },
  })

  app.get('/openapi.json', async () => app.swagger())

  await app.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: {
      spec: { url: '/openapi.json' },
    },
  })
}
