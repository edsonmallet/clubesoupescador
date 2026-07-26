import type { FastifyInstance } from 'fastify'
import type { ListRafflesUseCase } from '../../../application/raffles/list-raffles.usecase'
import type { Raffle } from '../../../domain/entities/Raffle'
import { RaffleNotFoundError } from '../../../domain/errors'
import type { IRaffleRepository } from '../../../domain/interfaces/IRaffleRepository'
import {
  ErrorResponseSchema,
  ListRafflesResponseSchema,
  RaffleResultResponseSchema,
  RaffleSchema,
} from '../schemas/raffles'

export type RafflesRouteDeps = {
  listRafflesUseCase: ListRafflesUseCase
  raffleRepository: IRaffleRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

function toRaffleResponse(raffle: Raffle) {
  return {
    id: raffle.id,
    title: raffle.title,
    description: raffle.description,
    prize: raffle.prize,
    imageUrl: raffle.imageUrl,
    ticketPriceCents: raffle.ticketPriceCents,
    status: raffle.status,
    contestNumber: raffle.contestNumber,
    winnerTicket: raffle.winnerTicket,
    winnerUid: raffle.winnerUid,
    drawnAt: raffle.drawnAt?.toISOString() ?? null,
    createdAt: raffle.createdAt.toISOString(),
  }
}

export async function registerRafflesRoutes(
  app: FastifyInstance,
  deps: RafflesRouteDeps,
): Promise<void> {
  app.get(
    '/raffles',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            perPage: { type: 'number', default: 20 },
          },
        },
        response: { 200: ListRafflesResponseSchema, 400: ErrorResponseSchema },
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

      const { page = 1, perPage = 20 } = request.query as {
        page?: number
        perPage?: number
      }
      const result = await deps.listRafflesUseCase.execute({
        tenantId,
        page,
        perPage,
      })

      reply.status(200).send({
        items: result.items.map(toRaffleResponse),
        total: result.total,
      })
    },
  )

  app.get(
    '/raffles/:id',
    {
      schema: {
        response: {
          200: RaffleSchema,
          404: ErrorResponseSchema,
          400: ErrorResponseSchema,
        },
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
      const raffle = await deps.raffleRepository.findById(tenantId, id)
      if (!raffle) throw new RaffleNotFoundError(id)

      reply.status(200).send(toRaffleResponse(raffle))
    },
  )

  app.get(
    '/raffles/:id/result',
    {
      schema: {
        response: {
          200: RaffleResultResponseSchema,
          404: ErrorResponseSchema,
          400: ErrorResponseSchema,
        },
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
      const raffle = await deps.raffleRepository.findById(tenantId, id)
      if (!raffle) throw new RaffleNotFoundError(id)

      reply.status(200).send({
        status: raffle.status,
        contestNumber: raffle.contestNumber,
        winnerTicket: raffle.winnerTicket,
        winnerUid: raffle.winnerUid,
        drawnAt: raffle.drawnAt?.toISOString() ?? null,
      })
    },
  )
}
