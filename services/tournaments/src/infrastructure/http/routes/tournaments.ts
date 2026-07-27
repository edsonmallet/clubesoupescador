import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { Tournament } from '../../../domain/entities/Tournament'
import { TournamentNotFoundError } from '../../../domain/errors'
import type { ITournamentRepository } from '../../../domain/interfaces/ITournamentRepository'
import {
  CreateTournamentBodySchema,
  ErrorResponseSchema,
  ListTournamentsResponseSchema,
  TournamentSchema,
} from '../schemas/tournaments'

export type TournamentsRouteDeps = {
  tournamentsAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  tournamentRepository: ITournamentRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

function toResponse(tournament: Tournament) {
  return {
    id: tournament.id,
    title: tournament.title,
    description: tournament.description,
    status: tournament.status,
    createdAt: tournament.createdAt.toISOString(),
  }
}

export async function registerTournamentsRoutes(
  app: FastifyInstance,
  deps: TournamentsRouteDeps,
): Promise<void> {
  app.get(
    '/tournaments',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            perPage: { type: 'number', default: 20 },
          },
        },
        response: { 200: ListTournamentsResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const { page = 1, perPage = 20 } = request.query as {
        page?: number
        perPage?: number
      }
      const result = await deps.tournamentRepository.findMany(tenantId, page, perPage)

      reply.status(200).send({ items: result.items.map(toResponse), total: result.total })
    },
  )

  app.get(
    '/tournaments/:id',
    {
      schema: {
        response: { 200: TournamentSchema, 404: ErrorResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const { id } = request.params as { id: string }
      const tournament = await deps.tournamentRepository.findById(tenantId, id)
      if (!tournament) throw new TournamentNotFoundError(id)

      reply.status(200).send(toResponse(tournament))
    },
  )

  app.post(
    '/tournaments',
    {
      preHandler: [deps.tournamentsAuthPreHandler, deps.requireOwner],
      schema: {
        body: CreateTournamentBodySchema,
        response: { 201: TournamentSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request.headers)
      if (!tenantId) {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const body = request.body as { title: string; description: string }
      const tournament = await deps.tournamentRepository.create({ tenantId, ...body })

      reply.status(201).send(toResponse(tournament))
    },
  )
}
