import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { Submission } from '../../../domain/entities/Submission'
import { SubmissionNotFoundError } from '../../../domain/errors'
import type { ISubmissionRepository } from '../../../domain/interfaces/ISubmissionRepository'
import {
  CreateSubmissionBodySchema,
  ErrorResponseSchema,
  ListSubmissionsResponseSchema,
  SetScoreBodySchema,
  SubmissionSchema,
} from '../schemas/tournaments'

export type SubmissionsRouteDeps = {
  tournamentsAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  submissionRepository: ISubmissionRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

function toResponse(submission: Submission) {
  return {
    id: submission.id,
    tournamentId: submission.tournamentId,
    authorUid: submission.authorUid,
    mediaUrl: submission.mediaUrl,
    voteScore: submission.voteScore,
    manualScore: submission.manualScore,
    createdAt: submission.createdAt.toISOString(),
  }
}

export async function registerSubmissionsRoutes(
  app: FastifyInstance,
  deps: SubmissionsRouteDeps,
): Promise<void> {
  app.post(
    '/tournaments/:id/submissions',
    {
      preHandler: [deps.tournamentsAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: CreateSubmissionBodySchema,
        response: { 201: SubmissionSchema, 400: ErrorResponseSchema },
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
      const user = request.user as AuthenticatedUser
      const { mediaUrl } = request.body as { mediaUrl: string }

      const submission = await deps.submissionRepository.create({
        tenantId,
        tournamentId: id,
        authorUid: user.uid,
        mediaUrl,
      })

      reply.status(201).send(toResponse(submission))
    },
  )

  app.get(
    '/tournaments/:id/submissions',
    {
      preHandler: [deps.tournamentsAuthPreHandler, deps.requireOwner],
      schema: {
        response: { 200: ListSubmissionsResponseSchema, 400: ErrorResponseSchema },
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
      const submissions = await deps.submissionRepository.findByTournament(tenantId, id)

      reply.status(200).send(submissions.map(toResponse))
    },
  )

  app.patch(
    '/submissions/:id/score',
    {
      preHandler: [deps.tournamentsAuthPreHandler, deps.requireOwner],
      schema: {
        body: SetScoreBodySchema,
        response: { 200: SubmissionSchema, 404: ErrorResponseSchema, 400: ErrorResponseSchema },
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
      const existing = await deps.submissionRepository.findById(tenantId, id)
      if (!existing) throw new SubmissionNotFoundError(id)

      const { manualScore } = request.body as { manualScore: number }
      const submission = await deps.submissionRepository.setManualScore(id, manualScore)

      reply.status(200).send(toResponse(submission))
    },
  )
}
