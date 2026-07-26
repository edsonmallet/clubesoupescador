import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { ToggleReactionUseCase } from '../../../application/reactions/toggle-reaction.usecase'
import type { Emoji } from '../../../domain/interfaces/IReactionRepository'
import {
  ErrorResponseSchema,
  ReactBodySchema,
  ReactResponseSchema,
} from '../schemas/reactions'

export type ReactionsRouteDeps = {
  communityAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  toggleReactionUseCase: ToggleReactionUseCase
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerReactionsRoutes(
  app: FastifyInstance,
  deps: ReactionsRouteDeps,
): Promise<void> {
  app.post(
    '/topics/:id/react',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: ReactBodySchema,
        response: { 200: ReactResponseSchema, 400: ErrorResponseSchema },
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
      const { emoji } = request.body as { emoji: Emoji }

      const result = await deps.toggleReactionUseCase.execute({
        tenantId,
        targetType: 'topic',
        targetId: id,
        uid: user.uid,
        emoji,
      })

      reply.status(200).send(result)
    },
  )

  app.post(
    '/comments/:id/react',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: ReactBodySchema,
        response: { 200: ReactResponseSchema, 400: ErrorResponseSchema },
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
      const { emoji } = request.body as { emoji: Emoji }

      const result = await deps.toggleReactionUseCase.execute({
        tenantId,
        targetType: 'comment',
        targetId: id,
        uid: user.uid,
        emoji,
      })

      reply.status(200).send(result)
    },
  )
}
