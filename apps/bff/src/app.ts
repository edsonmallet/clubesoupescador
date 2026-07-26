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
import { registerCashbackProxyRoutes } from './infrastructure/http/routes/cashback'
import { registerRafflesProxyRoutes } from './infrastructure/http/routes/raffles'
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
  await registerCashbackProxyRoutes(app, {
    cashbackServiceUrl: env.CASHBACK_SERVICE_URL,
    tenantAuthPreHandler,
    requireAuth,
  })
  await registerRafflesProxyRoutes(app, {
    rafflesServiceUrl: env.RAFFLES_SERVICE_URL,
    tenantAuthPreHandler,
    requireSubscriber,
    requireOwner,
  })

  return app
}
