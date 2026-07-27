import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  addDomainUseCase,
  createSuperAdminUseCase,
  createTenantUseCase,
  getLandingConfigUseCase,
  getMeUseCase,
  getTenantUseCase,
  impersonateTenantUseCase,
  listDomainsUseCase,
  listTenantsUseCase,
  registerUserUseCase,
  superAuthPreHandler,
  tenantAuthPreHandler,
  updateLandingConfigUseCase,
  updateTenantBillingUseCase,
  updateTenantStatusUseCase,
  verifyDomainUseCase,
} from './infrastructure/http/container'
import {
  requireAuth,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from './infrastructure/http/proxy'
import { registerAuthRoutes } from './infrastructure/http/routes/auth'
import { registerBillingProxyRoutes } from './infrastructure/http/routes/billing-proxy'
import { registerCashbackProxyRoutes } from './infrastructure/http/routes/cashback'
import { registerCommunityProxyRoutes } from './infrastructure/http/routes/community'
import { registerInternalRoutes } from './infrastructure/http/routes/internal'
import { registerLandingRoutes } from './infrastructure/http/routes/landing'
import { registerRafflesProxyRoutes } from './infrastructure/http/routes/raffles'
import { registerStoreProxyRoutes } from './infrastructure/http/routes/store'
import { registerSubscriptionsProxyRoutes } from './infrastructure/http/routes/subscriptions'
import { registerSuperTenantsRoutes } from './infrastructure/http/routes/super-tenants'
import { registerTournamentsProxyRoutes } from './infrastructure/http/routes/tournaments'
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
    requireOwner,
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
    requireOwner,
  })
  await registerRafflesProxyRoutes(app, {
    rafflesServiceUrl: env.RAFFLES_SERVICE_URL,
    tenantAuthPreHandler,
    requireSubscriber,
    requireOwner,
  })
  await registerCommunityProxyRoutes(app, {
    communityServiceUrl: env.COMMUNITY_SERVICE_URL,
    tenantAuthPreHandler,
    requireAuth,
    requireSubscriber,
    requireOwner,
  })
  await registerTournamentsProxyRoutes(app, {
    tournamentsServiceUrl: env.TOURNAMENTS_SERVICE_URL,
    tenantAuthPreHandler,
    requireSubscriber,
    requireOwner,
  })
  await registerLandingRoutes(app, {
    tenantAuthPreHandler,
    requireOwner,
    getLandingConfigUseCase,
    updateLandingConfigUseCase,
    listDomainsUseCase,
    addDomainUseCase,
    verifyDomainUseCase,
  })
  await registerSuperTenantsRoutes(app, {
    superAuthPreHandler,
    requireSuperAdmin,
    listTenantsUseCase,
    getTenantUseCase,
    createTenantUseCase,
    updateTenantStatusUseCase,
    impersonateTenantUseCase,
    createSuperAdminUseCase,
  })
  await registerInternalRoutes(app, {
    updateTenantBillingUseCase,
  })
  await registerBillingProxyRoutes(app, {
    billingServiceUrl: env.BILLING_SERVICE_URL,
    superAuthPreHandler,
    requireOwner,
    requireSuperAdmin,
  })

  return app
}
