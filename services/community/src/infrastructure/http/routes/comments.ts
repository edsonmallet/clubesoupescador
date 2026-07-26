import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateCommentUseCase } from '../../../application/comments/create-comment.usecase'
import type { ICommentRepository } from '../../../domain/interfaces/ICommentRepository'
import {
  CommentSchema,
  CreateCommentBodySchema,
  ErrorResponseSchema,
} from '../schemas/comments'

export type CommentsRouteDeps = {
  communityAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  createCommentUseCase: CreateCommentUseCase
  commentRepository: ICommentRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerCommentsRoutes(
  app: FastifyInstance,
  deps: CommentsRouteDeps,
): Promise<void> {
  app.post(
    '/comments/:topicId',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: CreateCommentBodySchema,
        response: { 201: CommentSchema, 400: ErrorResponseSchema },
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

      const { topicId } = request.params as { topicId: string }
      const user = request.user as AuthenticatedUser
      const body = request.body as { parentId: string | null; body: string }

      const comment = await deps.createCommentUseCase.execute({
        tenantId,
        topicId,
        authorUid: user.uid,
        parentId: body.parentId,
        body: body.body,
      })

      reply.status(201).send({
        id: comment.id,
        topicId: comment.topicId,
        authorUid: comment.authorUid,
        parentId: comment.parentId,
        depth: comment.depth,
        body: comment.body,
        voteScore: comment.voteScore,
        deleted: comment.deleted,
        createdAt: comment.createdAt.toISOString(),
      })
    },
  )

  app.delete(
    '/comments/:id',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireOwner],
      schema: {
        response: { 204: { type: 'null' }, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await deps.commentRepository.softDelete(id)
      reply.status(204).send()
    },
  )
}
