import type { FastifyInstance } from 'fastify'
import { CategoryNotFoundError } from '../../../domain/errors'
import type { ICategoryRepository } from '../../../domain/interfaces/ICategoryRepository'
import type { ITopicRepository } from '../../../domain/interfaces/ITopicRepository'
import { env } from '../../../shared/env'
import {
  ErrorResponseSchema,
  InternalCreateTopicBodySchema,
  InternalCreateTopicResponseSchema,
} from '../schemas/internal'

export type InternalRouteDeps = {
  categoryRepository: ICategoryRepository
  topicRepository: ITopicRepository
}

/**
 * Used by other services (raffles opening a raffle, in the future
 * tournaments creating a tournament) to auto-post a system topic without
 * going through the subscriber-only POST /topics — protected by a shared
 * secret instead of a member's Firebase token, same pattern as
 * services/store's Asaas webhook token check.
 */
export async function registerInternalRoutes(
  app: FastifyInstance,
  deps: InternalRouteDeps,
): Promise<void> {
  app.post(
    '/internal/topics',
    {
      schema: {
        body: InternalCreateTopicBodySchema,
        response: {
          200: InternalCreateTopicResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = request.headers['x-internal-token']
      if (token !== env.INTERNAL_SERVICE_TOKEN) {
        reply.status(401).send({
          error: {
            code: 'INVALID_INTERNAL_TOKEN',
            message: 'Invalid internal token',
          },
        })
        return
      }

      const body = request.body as {
        tenantId: string
        categorySlug: string
        authorUid: string
        title: string
        body: string
      }

      const category = await deps.categoryRepository.findBySlug(
        body.tenantId,
        body.categorySlug,
      )
      if (!category) throw new CategoryNotFoundError(body.categorySlug)

      const topic = await deps.topicRepository.create({
        tenantId: body.tenantId,
        categoryId: category.id,
        authorUid: body.authorUid,
        title: body.title,
        body: body.body,
      })

      reply.status(200).send({ id: topic.id })
    },
  )
}
