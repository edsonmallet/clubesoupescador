import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { ICategoryRepository } from '../../../domain/interfaces/ICategoryRepository'
import {
  CategorySchema,
  CreateCategoryBodySchema,
  ErrorResponseSchema,
  ListCategoriesResponseSchema,
} from '../schemas/categories'

export type CategoriesRouteDeps = {
  communityAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  categoryRepository: ICategoryRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerCategoriesRoutes(
  app: FastifyInstance,
  deps: CategoriesRouteDeps,
): Promise<void> {
  app.get(
    '/categories',
    {
      schema: {
        response: {
          200: ListCategoriesResponseSchema,
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

      const categories = await deps.categoryRepository.findAll(tenantId)
      reply.status(200).send(
        categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
        })),
      )
    },
  )

  app.post(
    '/categories',
    {
      preHandler: [deps.communityAuthPreHandler, deps.requireOwner],
      schema: {
        body: CreateCategoryBodySchema,
        response: { 201: CategorySchema, 400: ErrorResponseSchema },
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
        slug: string
        name: string
        description: string
      }
      const category = await deps.categoryRepository.create({
        tenantId,
        ...body,
      })

      reply.status(201).send({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
      })
    },
  )
}
