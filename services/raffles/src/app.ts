import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  buyTicketsUseCase,
  enqueueConfirmTickets,
  enqueueDrawRaffle,
  joinRaffleUseCase,
  listRafflesUseCase,
  raffleRepository,
  rafflesAuthPreHandler,
  requireOwner,
  requireSubscriber,
  ticketRepository,
} from './infrastructure/http/container'
import { registerAdminRoutes } from './infrastructure/http/routes/admin'
import { registerRafflesRoutes } from './infrastructure/http/routes/raffles'
import { registerTicketsRoutes } from './infrastructure/http/routes/tickets'
import { registerWebhookRoutes } from './infrastructure/http/routes/webhook'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Raffles')
  await registerHealth(app)
  await registerRafflesRoutes(app, { listRafflesUseCase, raffleRepository })
  await registerTicketsRoutes(app, {
    rafflesAuthPreHandler,
    requireSubscriber,
    joinRaffleUseCase,
    buyTicketsUseCase,
    ticketRepository,
  })
  await registerAdminRoutes(app, {
    rafflesAuthPreHandler,
    requireOwner,
    raffleRepository,
    enqueueDrawRaffle,
  })
  await registerWebhookRoutes(app, { enqueueConfirmTickets })

  return app
}
