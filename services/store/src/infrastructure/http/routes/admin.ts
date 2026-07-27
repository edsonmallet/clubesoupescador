import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { OrderStatus } from '../../../domain/entities/Order'
import { OrderNotFoundError } from '../../../domain/errors'
import type { IOrderRepository } from '../../../domain/interfaces/IOrderRepository'
import type { IProductRepository } from '../../../domain/interfaces/IProductRepository'
import {
  AdminUpdateOrderBodySchema,
  ErrorResponseSchema,
  ListOrdersResponseSchema,
  OrderSchema,
  OrdersSummaryResponseSchema,
} from '../schemas/orders'
import { AdminListProductsResponseSchema } from '../schemas/products'

export type AdminRouteDeps = {
  storeAuthPreHandler: preHandlerHookHandler
  requireOwner: preHandlerHookHandler
  orderRepository: IOrderRepository
  productRepository: IProductRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  deps: AdminRouteDeps,
): Promise<void> {
  app.get(
    '/admin/products',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireOwner],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            perPage: { type: 'number', default: 20 },
          },
        },
        response: {
          200: AdminListProductsResponseSchema,
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

      const { page = 1, perPage = 20 } = request.query as {
        page?: number
        perPage?: number
      }
      // No active filter — admin needs to see inactive products too, to
      // reactivate them.
      const result = await deps.productRepository.findMany(
        tenantId,
        page,
        perPage,
      )

      reply.status(200).send({
        items: result.items.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          priceFullCents: product.priceFullCents,
          priceClubCents: product.priceClubCents,
          stock: product.stock,
          sku: product.sku,
          images: product.images,
          active: product.active,
        })),
        total: result.total,
      })
    },
  )

  app.get(
    '/admin/orders',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireOwner],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            uid: { type: 'string' },
          },
        },
        response: { 200: ListOrdersResponseSchema, 400: ErrorResponseSchema },
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

      const { page = 1, uid } = request.query as { page?: number; uid?: string }
      const result = await deps.orderRepository.findMany(
        tenantId,
        uid ?? null,
        page,
        20,
      )

      reply.status(200).send({
        items: result.items.map((order) => ({
          id: order.id,
          status: order.status,
          items: order.items,
          subtotalCents: order.subtotalCents,
          levelDiscountAmtCents: order.levelDiscountAmtCents,
          cashbackUsedAmtCents: order.cashbackUsedAmtCents,
          shippingAmtCents: order.shippingAmtCents,
          totalCents: order.totalCents,
          trackingCode: order.trackingCode,
          shippingLabelUrl: order.shippingLabelUrl,
          address: order.address,
          createdAt: order.createdAt.toISOString(),
        })),
        total: result.total,
      })
    },
  )

  app.patch(
    '/admin/orders/:id',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireOwner],
      schema: {
        body: AdminUpdateOrderBodySchema,
        response: {
          200: OrderSchema,
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
      const body = request.body as {
        status?: string
        trackingCode?: string
        shippingLabelUrl?: string
      }

      const existing = await deps.orderRepository.findById(tenantId, id)
      if (!existing) throw new OrderNotFoundError(id)

      let order = existing
      if (body.status) {
        order = await deps.orderRepository.updateStatus(
          id,
          body.status as OrderStatus,
        )
      }
      if (body.trackingCode) {
        order = await deps.orderRepository.updateTracking(
          id,
          body.trackingCode,
          body.shippingLabelUrl ?? null,
        )
      }

      reply.status(200).send({
        id: order.id,
        status: order.status,
        items: order.items,
        subtotalCents: order.subtotalCents,
        levelDiscountAmtCents: order.levelDiscountAmtCents,
        cashbackUsedAmtCents: order.cashbackUsedAmtCents,
        shippingAmtCents: order.shippingAmtCents,
        totalCents: order.totalCents,
        trackingCode: order.trackingCode,
        shippingLabelUrl: order.shippingLabelUrl,
        address: order.address,
        createdAt: order.createdAt.toISOString(),
      })
    },
  )

  app.get(
    '/admin/summary',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireOwner],
      schema: { response: { 200: OrdersSummaryResponseSchema, 400: ErrorResponseSchema } },
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

      const summary = await deps.orderRepository.getSummary(tenantId)
      reply.status(200).send(summary)
    },
  )
}
