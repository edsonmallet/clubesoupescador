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
import {
  requireAuth,
  requireOwner,
  requireSubscriber,
} from './infrastructure/http/proxy'
import { registerAuthRoutes } from './infrastructure/http/routes/auth'
import { registerStoreProxyRoutes } from './infrastructure/http/routes/store'
import { registerSubscriptionsProxyRoutes } from './infrastructure/http/routes/subscriptions'
import { env } from './shared/env'

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
  await registerSubscriptionsProxyRoutes(app, {
    subscriptionsServiceUrl: env.SUBSCRIPTIONS_SERVICE_URL,
    tenantAuthPreHandler,
    requireAuth,
  })
  await registerStoreProxyRoutes(app, {
    storeServiceUrl: env.STORE_SERVICE_URL,
    tenantAuthPreHandler,
    requireAuth,
    requireSubscriber,
    requireOwner,
  })

  return app
}
