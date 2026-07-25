import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  getMeUseCase,
  registerUserUseCase,
  tenantAuthPreHandler,
} from './infrastructure/http/container'
import { requireAuth } from './infrastructure/http/proxy'
import { registerAuthRoutes } from './infrastructure/http/routes/auth'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube BFF')
  await registerHealth(app)
  await registerAuthRoutes(app, {
    tenantAuthPreHandler,
    requireAuth,
    registerUserUseCase,
    getMeUseCase,
  })

  return app
}
