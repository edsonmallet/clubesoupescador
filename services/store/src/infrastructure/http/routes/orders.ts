import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateOrderUseCase } from '../../../application/orders/create-order.usecase'
import { OrderNotFoundError } from '../../../domain/errors'
import type { IOrderRepository } from '../../../domain/interfaces/IOrderRepository'
import {
  CreateOrderBodySchema,
  CreateOrderResponseSchema,
  ErrorResponseSchema,
  ListOrdersResponseSchema,
  OrderSchema,
} from '../schemas/orders'

export type OrdersRouteDeps = {
  storeAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  requireSubscriber: preHandlerHookHandler
  createOrderUseCase: CreateOrderUseCase
  orderRepository: IOrderRepository
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

function toOrderResponse(
  order: Awaited<ReturnType<IOrderRepository['findById']>>,
) {
  if (!order) return null
  return {
    id: order.id,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      discountPct: item.discountPct,
    })),
    subtotalCents: order.subtotalCents,
    levelDiscountAmtCents: order.levelDiscountAmtCents,
    cashbackUsedAmtCents: order.cashbackUsedAmtCents,
    shippingAmtCents: order.shippingAmtCents,
    totalCents: order.totalCents,
    trackingCode: order.trackingCode,
    shippingLabelUrl: order.shippingLabelUrl,
    address: order.address,
    createdAt: order.createdAt.toISOString(),
  }
}

export async function registerOrdersRoutes(
  app: FastifyInstance,
  deps: OrdersRouteDeps,
): Promise<void> {
  app.post(
    '/orders',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireSubscriber],
      schema: {
        body: CreateOrderBodySchema,
        response: { 201: CreateOrderResponseSchema, 400: ErrorResponseSchema },
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
      const authToken = request.headers.authorization?.split('Bearer ')[1] ?? ''
      const body = request.body as {
        items: Array<{ productId: string; qty: number }>
        cashbackUseCents: number
        address: {
          zipCode: string
          street: string
          number: string
          complement: string | null
          neighborhood: string
          city: string
          state: string
        }
      }

      const result = await deps.createOrderUseCase.execute({
        uid: user.uid,
        tenantId,
        authToken,
        items: body.items,
        cashbackUseCents: body.cashbackUseCents,
        address: body.address,
      })

      reply.status(201).send(result)
    },
  )

  app.get(
    '/orders',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireAuth],
      schema: {
        querystring: {
          type: 'object',
          properties: { page: { type: 'number', default: 1 } },
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

      const user = request.user as AuthenticatedUser
      const { page = 1 } = request.query as { page?: number }

      const result = await deps.orderRepository.findMany(
        tenantId,
        user.uid,
        page,
        20,
      )

      reply.status(200).send({
        items: result.items.map((order) => toOrderResponse(order)),
        total: result.total,
      })
    },
  )

  app.get(
    '/orders/:id',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireAuth],
      schema: {
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
      const order = await deps.orderRepository.findById(tenantId, id)
      if (!order) throw new OrderNotFoundError(id)

      reply.status(200).send(toOrderResponse(order))
    },
  )
}
