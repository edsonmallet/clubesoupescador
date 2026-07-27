import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { Raffle, RaffleStatus } from '../../../domain/entities/Raffle'
import { RaffleNotFoundError } from '../../../domain/errors'
import type { IRaffleRepository } from '../../../domain/interfaces/IRaffleRepository'
import type { CommunityClient } from '../../external/community/client'
import {
  CreateRaffleBodySchema,
  DrawQueuedResponseSchema,
  DrawRaffleBodySchema,
  ErrorResponseSchema,
  RaffleSchema,
  UpdateRaffleBodySchema,
} from '../schemas/raffles'

export type EnqueueDrawRaffle = (data: {
  tenantId: string
  raffleId: string
  contestNumber: number
}) => Promise<void>

export type AdminRouteDeps = {
  rafflesAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  raffleRepository: IRaffleRepository
  enqueueDrawRaffle: EnqueueDrawRaffle
  communityClient: CommunityClient
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
    maxTickets: raffle.maxTickets,
    drawDate: raffle.drawDate?.toISOString() ?? null,
    lotteryGame: raffle.lotteryGame,
    status: raffle.status,
    contestNumber: raffle.contestNumber,
    winnerTicket: raffle.winnerTicket,
    winnerUid: raffle.winnerUid,
    drawnAt: raffle.drawnAt?.toISOString() ?? null,
    createdAt: raffle.createdAt.toISOString(),
  }
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  deps: AdminRouteDeps,
): Promise<void> {
  app.post(
    '/raffles',
    {
      preHandler: [deps.rafflesAuthPreHandler, deps.requireOwner],
      schema: {
        body: CreateRaffleBodySchema,
        response: { 201: RaffleSchema, 400: ErrorResponseSchema },
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

      const body = request.body as {
        title: string
        description: string
        prize: string
        imageUrl: string | null
        ticketPriceCents: number
        maxTickets: number | null
        drawDate: string | null
        lotteryGame?: string
      }

      const raffle = await deps.raffleRepository.create({
        tenantId,
        title: body.title,
        description: body.description,
        prize: body.prize,
        imageUrl: body.imageUrl,
        ticketPriceCents: body.ticketPriceCents,
        maxTickets: body.maxTickets,
        drawDate: body.drawDate ? new Date(body.drawDate) : null,
        lotteryGame: body.lotteryGame ?? 'federal',
      })

      // Best-effort — the raffle already exists once created; a failed
      // community post shouldn't roll back or fail the raffle creation.
      try {
        await deps.communityClient.createSystemTopic({
          tenantId,
          categorySlug: 'rifas',
          title: `Nova rifa: ${raffle.title}`,
          body: `${raffle.description}\n\nPrêmio: ${raffle.prize}`,
        })
      } catch (error) {
        request.log.error(
          error,
          'Failed to auto-create community topic for raffle',
        )
      }

      reply.status(201).send(toRaffleResponse(raffle))
    },
  )

  app.patch(
    '/raffles/:id',
    {
      preHandler: [deps.rafflesAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateRaffleBodySchema,
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
      const existing = await deps.raffleRepository.findById(tenantId, id)
      if (!existing) throw new RaffleNotFoundError(id)

      const body = request.body as Partial<{
        title: string
        description: string
        prize: string
        imageUrl: string | null
        ticketPriceCents: number
        maxTickets: number | null
        drawDate: string | null
        lotteryGame: string
        status: RaffleStatus
      }>

      const raffle = await deps.raffleRepository.update(id, {
        ...body,
        drawDate:
          body.drawDate !== undefined
            ? body.drawDate
              ? new Date(body.drawDate)
              : null
            : undefined,
      })

      reply.status(200).send(toRaffleResponse(raffle))
    },
  )

  app.post(
    '/raffles/:id/draw',
    {
      preHandler: [deps.rafflesAuthPreHandler, deps.requireOwner],
      schema: {
        body: DrawRaffleBodySchema,
        response: {
          202: DrawQueuedResponseSchema,
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
      const existing = await deps.raffleRepository.findById(tenantId, id)
      if (!existing) throw new RaffleNotFoundError(id)

      const { contestNumber } = request.body as { contestNumber: number }

      await deps.enqueueDrawRaffle({ tenantId, raffleId: id, contestNumber })

      reply.status(202).send({ queued: true })
    },
  )
}
