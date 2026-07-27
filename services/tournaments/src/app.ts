import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  requireOwner,
  requireSubscriber,
  submissionRepository,
  tournamentRepository,
  tournamentsAuthPreHandler,
} from './infrastructure/http/container'
import { registerSubmissionsRoutes } from './infrastructure/http/routes/submissions'
import { registerTournamentsRoutes } from './infrastructure/http/routes/tournaments'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Tournaments')
  await registerHealth(app)
  await registerTournamentsRoutes(app, {
    tournamentsAuthPreHandler,
    requireOwner,
    tournamentRepository,
  })
  await registerSubmissionsRoutes(app, {
    tournamentsAuthPreHandler,
    requireSubscriber,
    requireOwner,
    submissionRepository,
  })

  return app
}
