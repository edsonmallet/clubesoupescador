import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { ToggleVoteUseCase } from '../../../application/votes/toggle-vote.usecase'
import {
  ErrorResponseSchema,
  VoteBodySchema,
  VoteResponseSchema,
} from '../schemas/votes'

export type VotesRouteDeps = {
  communityAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  toggleVoteUseCase: ToggleVoteUseCase
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerVotesRoutes(
  app: FastifyInstance,
  deps: VotesRouteDeps,
): Promise<void> {
  app.post(
    '/topics/:id/vote',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: VoteBodySchema,
        response: { 200: VoteResponseSchema, 400: ErrorResponseSchema },
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
      const { value } = request.body as { value: 1 | -1 }

      const result = await deps.toggleVoteUseCase.execute({
        tenantId,
        targetType: 'topic',
        targetId: id,
        uid: user.uid,
        value,
      })

      reply.status(200).send(result)
    },
  )

  app.post(
    '/comments/:id/vote',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: VoteBodySchema,
        response: { 200: VoteResponseSchema, 400: ErrorResponseSchema },
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
      const { value } = request.body as { value: 1 | -1 }

      const result = await deps.toggleVoteUseCase.execute({
        tenantId,
        targetType: 'comment',
        targetId: id,
        uid: user.uid,
        value,
      })

      reply.status(200).send(result)
    },
  )
}
