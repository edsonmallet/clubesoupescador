import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateTopicUseCase } from '../../../application/topics/create-topic.usecase'
import type { GetTopicUseCase } from '../../../application/topics/get-topic.usecase'
import type { ListTopicsUseCase } from '../../../application/topics/list-topics.usecase'
import type { Topic } from '../../../domain/entities/Topic'
import type { TopicSort } from '../../../domain/interfaces/ITopicRepository'
import type { ITopicRepository } from '../../../domain/interfaces/ITopicRepository'
import {
  CreateTopicBodySchema,
  ErrorResponseSchema,
  ListTopicsResponseSchema,
  TopicDetailResponseSchema,
  TopicSchema,
  UpdateTopicBodySchema,
} from '../schemas/topics'

export type TopicsRouteDeps = {
  communityAuthPreHandler: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  createTopicUseCase: CreateTopicUseCase
  listTopicsUseCase: ListTopicsUseCase
  getTopicUseCase: GetTopicUseCase
  topicRepository: ITopicRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

function toTopicResponse(topic: Topic) {
  return {
    id: topic.id,
    categoryId: topic.categoryId,
    authorUid: topic.authorUid,
    title: topic.title,
    body: topic.body,
    pinned: topic.pinned,
    locked: topic.locked,
    voteScore: topic.voteScore,
    commentCount: topic.commentCount,
    createdAt: topic.createdAt.toISOString(),
  }
}

export async function registerTopicsRoutes(
  app: FastifyInstance,
  deps: TopicsRouteDeps,
): Promise<void> {
  app.get(
    '/topics',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            categoryId: { type: 'string' },
            sort: { type: 'string', default: 'hot' },
            page: { type: 'number', default: 1 },
            perPage: { type: 'number', default: 20 },
          },
        },
        response: { 200: ListTopicsResponseSchema, 400: ErrorResponseSchema },
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

      const {
        categoryId = null,
        sort = 'hot',
        page = 1,
        perPage = 20,
      } = request.query as {
        categoryId?: string | null
        sort?: TopicSort
        page?: number
        perPage?: number
      }

      const result = await deps.listTopicsUseCase.execute({
        tenantId,
        categoryId,
        sort,
        page,
        perPage,
      })

      reply.status(200).send({
        items: result.items.map(toTopicResponse),
        total: result.total,
      })
    },
  )

  app.get(
    '/topics/:id',
    {
      schema: {
        response: {
          200: TopicDetailResponseSchema,
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
      const user = request.user as AuthenticatedUser | undefined

      const result = await deps.getTopicUseCase.execute({
        tenantId,
        topicId: id,
        uid: user?.uid ?? null,
      })

      reply.status(200).send({
        topic: toTopicResponse(result.topic),
        comments: result.comments.map((comment) => ({
          id: comment.id,
          topicId: comment.topicId,
          authorUid: comment.authorUid,
          parentId: comment.parentId,
          depth: comment.depth,
          body: comment.body,
          voteScore: comment.voteScore,
          deleted: comment.deleted,
          createdAt: comment.createdAt.toISOString(),
        })),
        reactionCounts: result.reactionCounts,
        myReactions: result.myReactions,
      })
    },
  )

  app.post(
    '/topics',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: CreateTopicBodySchema,
        response: { 201: TopicSchema, 400: ErrorResponseSchema },
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

      const user = request.user as AuthenticatedUser
      const body = request.body as {
        categoryId: string
        title: string
        body: string
      }

      const topic = await deps.createTopicUseCase.execute({
        tenantId,
        categoryId: body.categoryId,
        authorUid: user.uid,
        title: body.title,
        body: body.body,
      })

      reply.status(201).send(toTopicResponse(topic))
    },
  )

  app.patch(
    '/topics/:id',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateTopicBodySchema,
        response: { 200: TopicSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as Partial<{
        pinned: boolean
        locked: boolean
        deleted: boolean
      }>

      const topic = await deps.topicRepository.update(id, body)
      reply.status(200).send(toTopicResponse(topic))
    },
  )
}
