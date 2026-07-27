import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  cashbackAuthPreHandler,
  cashbackRepository,
  configRepository,
  getBalanceUseCase,
  getHistoryUseCase,
  grantCashbackUseCase,
  requireAuth,
  requireOwner,
} from './infrastructure/http/container'
import { registerAdminRoutes } from './infrastructure/http/routes/admin'
import { registerBalanceRoutes } from './infrastructure/http/routes/balance'
import { registerHistoryRoutes } from './infrastructure/http/routes/history'
import { registerInternalRoutes } from './infrastructure/http/routes/internal'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Cashback')
  await registerHealth(app)
  await registerBalanceRoutes(app, {
    cashbackAuthPreHandler,
    requireAuth,
    getBalanceUseCase,
  })
  await registerHistoryRoutes(app, {
    cashbackAuthPreHandler,
    requireAuth,
    getHistoryUseCase,
  })
  await registerInternalRoutes(app, { grantCashbackUseCase })
  await registerAdminRoutes(app, {
    cashbackAuthPreHandler,
    requireOwner,
    configRepository,
    cashbackRepository,
  })

  return app
}
