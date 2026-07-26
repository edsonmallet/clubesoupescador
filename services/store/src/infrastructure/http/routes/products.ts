import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { GetProductUseCase } from '../../../application/products/get-product.usecase'
import type { ListProductsUseCase } from '../../../application/products/list-products.usecase'
import type { IProductRepository } from '../../../domain/interfaces/IProductRepository'
import {
  CreateProductBodySchema,
  ErrorResponseSchema,
  ListProductsResponseSchema,
  ProductListItemSchema,
  UpdateProductBodySchema,
} from '../schemas/products'

export type ProductsRouteDeps = {
  storeAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  listProductsUseCase: ListProductsUseCase
  getProductUseCase: GetProductUseCase
  productRepository: IProductRepository
}

const SUBSCRIBER_ROLES = new Set([
  'subscriber',
  'community_mod',
  'store_manager',
  'store_owner',
  'super_admin',
])

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerProductsRoutes(
  app: FastifyInstance,
  deps: ProductsRouteDeps,
): Promise<void> {
  app.get(
    '/products',
    {
      preHandler: [deps.storeAuthPreHandler],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            perPage: { type: 'number', default: 20 },
          },
        },
        response: { 200: ListProductsResponseSchema, 400: ErrorResponseSchema },
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
      const user = request.user as AuthenticatedUser | undefined

      const result = await deps.listProductsUseCase.execute({
        tenantId,
        isSubscriber: Boolean(user && SUBSCRIBER_ROLES.has(user.role)),
        page,
        perPage,
      })

      reply.status(200).send(result)
    },
  )

  app.get(
    '/products/:id',
    {
      preHandler: [deps.storeAuthPreHandler],
      schema: {
        response: {
          200: ProductListItemSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
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

      const product = await deps.getProductUseCase.execute({
        tenantId,
        id,
        isSubscriber: Boolean(user && SUBSCRIBER_ROLES.has(user.role)),
      })

      reply.status(200).send(product)
    },
  )

  app.post(
    '/products',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireOwner],
      schema: {
        body: CreateProductBodySchema,
        response: { 201: ProductListItemSchema, 400: ErrorResponseSchema },
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
        name: string
        description: string
        priceFullCents: number
        priceClubCents: number
        stock: number
        sku: string
        images: string[]
        active?: boolean
      }

      const product = await deps.productRepository.create({
        tenantId,
        name: body.name,
        description: body.description,
        priceFullCents: body.priceFullCents,
        priceClubCents: body.priceClubCents,
        stock: body.stock,
        sku: body.sku,
        images: body.images,
        active: body.active ?? true,
      })

      reply.status(201).send({
        id: product.id,
        name: product.name,
        description: product.description,
        priceFullCents: product.priceFullCents,
        priceClubCents: product.priceClubCents,
        stock: product.stock,
        images: product.images,
      })
    },
  )

  app.patch(
    '/products/:id',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireOwner],
      schema: {
        body: UpdateProductBodySchema,
        response: { 200: ProductListItemSchema, 400: ErrorResponseSchema },
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
      const body = request.body as Partial<{
        name: string
        description: string
        priceFullCents: number
        priceClubCents: number
        stock: number
        sku: string
        images: string[]
        active: boolean
      }>

      const product = await deps.productRepository.update(id, body)

      reply.status(200).send({
        id: product.id,
        name: product.name,
        description: product.description,
        priceFullCents: product.priceFullCents,
        priceClubCents: product.priceClubCents,
        stock: product.stock,
        images: product.images,
      })
    },
  )
}
