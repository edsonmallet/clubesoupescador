import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  createCheckoutUseCase,
  enqueueProcessWebhook,
  levelRepository,
  listPlansUseCase,
  requireAuth,
  subscriptionRepository,
  subscriptionsAuthPreHandler,
} from './infrastructure/http/container'
import { registerLevelsRoutes } from './infrastructure/http/routes/levels'
import { registerPlansRoutes } from './infrastructure/http/routes/plans'
import { registerSubscriptionsRoutes } from './infrastructure/http/routes/subscriptions'
import { registerWebhookRoutes } from './infrastructure/http/routes/webhook'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Subscriptions')
  await registerHealth(app)
  await registerPlansRoutes(app, { listPlansUseCase })
  await registerLevelsRoutes(app, { levelRepository })
  await registerSubscriptionsRoutes(app, {
    subscriptionsAuthPreHandler,
    requireAuth,
    createCheckoutUseCase,
    subscriptionRepository,
  })
  await registerWebhookRoutes(app, { enqueueProcessWebhook })

  return app
}
