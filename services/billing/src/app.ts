import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  billingAuthPreHandler,
  createCheckoutUseCase,
  createPlanUseCase,
  enqueueProcessWebhook,
  getBillingOverviewUseCase,
  listPlansUseCase,
  requireOwner,
  requireSuperAdmin,
  tenantBillingRepository,
  updatePlanUseCase,
} from './infrastructure/http/container'
import { registerBillingRoutes } from './infrastructure/http/routes/billing'
import { registerPlansRoutes } from './infrastructure/http/routes/plans'
import { registerWebhookRoutes } from './infrastructure/http/routes/webhook'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Billing')
  await registerHealth(app)
  await registerPlansRoutes(app, {
    billingAuthPreHandler,
    requireSuperAdmin,
    listPlansUseCase,
    createPlanUseCase,
    updatePlanUseCase,
  })
  await registerBillingRoutes(app, {
    billingAuthPreHandler,
    requireOwner,
    requireSuperAdmin,
    createCheckoutUseCase,
    tenantBillingRepository,
    getBillingOverviewUseCase,
  })
  await registerWebhookRoutes(app, { enqueueProcessWebhook })

  return app
}
