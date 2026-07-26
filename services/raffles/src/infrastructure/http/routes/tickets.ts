import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { BuyTicketsUseCase } from '../../../application/tickets/buy-tickets.usecase'
import type { JoinRaffleUseCase } from '../../../application/tickets/join-raffle.usecase'
import type { Ticket } from '../../../domain/entities/Ticket'
import type { ITicketRepository } from '../../../domain/interfaces/ITicketRepository'
import {
  BuyTicketsBodySchema,
  BuyTicketsResponseSchema,
  ErrorResponseSchema,
  JoinRaffleResponseSchema,
  MyTicketsResponseSchema,
} from '../schemas/tickets'

export type TicketsRouteDeps = {
  rafflesAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  joinRaffleUseCase: JoinRaffleUseCase
  buyTicketsUseCase: BuyTicketsUseCase
  ticketRepository: ITicketRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

function toTicketResponse(ticket: Ticket) {
  return {
    id: ticket.id,
    number: ticket.number,
    status: ticket.status,
    source: ticket.source,
    createdAt: ticket.createdAt.toISOString(),
  }
}

export async function registerTicketsRoutes(
  app: FastifyInstance,
  deps: TicketsRouteDeps,
): Promise<void> {
  app.post(
    '/raffles/:id/join',
    {
      preHandler: [deps.rafflesAuthPreHandler, deps.requireSubscriber],
      schema: {
        response: { 200: JoinRaffleResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const { id } = request.params as { id: string }
      const user = request.user as AuthenticatedUser
      const authToken = request.headers.authorization?.split('Bearer ')[1] ?? ''

      const result = await deps.joinRaffleUseCase.execute({
        uid: user.uid,
        tenantId,
        raffleId: id,
        authToken,
      })

      reply.status(200).send({
        tickets: result.tickets.map(toTicketResponse),
        count: result.count,
      })
    },
  )

  app.post(
    '/raffles/:id/buy',
    {
      preHandler: [deps.rafflesAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: BuyTicketsBodySchema,
        response: { 200: BuyTicketsResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const { id } = request.params as { id: string }
      const { qty } = request.body as { qty: number }
      const user = request.user as AuthenticatedUser

      const result = await deps.buyTicketsUseCase.execute({
        uid: user.uid,
        tenantId,
        raffleId: id,
        qty,
      })

      reply.status(200).send({
        tickets: result.tickets.map(toTicketResponse),
        paymentUrl: result.paymentUrl,
      })
    },
  )

  app.get(
    '/raffles/:id/my-tickets',
    {
      preHandler: [deps.rafflesAuthPreHandler, deps.requireSubscriber],
      schema: {
        response: { 200: MyTicketsResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const { id } = request.params as { id: string }
      const user = request.user as AuthenticatedUser

      const tickets = await deps.ticketRepository.findByUidAndRaffle(
        tenantId,
        id,
        user.uid,
      )

      reply.status(200).send(tickets.map(toTicketResponse))
    },
  )
}
