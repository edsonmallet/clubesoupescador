import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { QuoteShippingUseCase } from '../../../application/shipping/quote-shipping.usecase'
import {
  ErrorResponseSchema,
  QuoteShippingResponseSchema,
} from '../schemas/shipping'

export type ShippingRouteDeps = {
  storeAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  quoteShippingUseCase: QuoteShippingUseCase
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerShippingRoutes(
  app: FastifyInstance,
  deps: ShippingRouteDeps,
): Promise<void> {
  app.get(
    '/shipping/quote',
    {
      preHandler: [deps.storeAuthPreHandler, deps.requireAuth],
      schema: {
        querystring: {
          type: 'object',
          required: ['items', 'destinationZipCode'],
          properties: {
            items: { type: 'string' },
            destinationZipCode: { type: 'string' },
          },
        },
        response: {
          200: QuoteShippingResponseSchema,
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

      const { items, destinationZipCode } = request.query as {
        items: string
        destinationZipCode: string
      }

      let parsedItems: Array<{ productId: string; qty: number }>
      try {
        parsedItems = JSON.parse(items)
      } catch {
        reply.status(400).send({
          error: {
            code: 'INVALID_ITEMS',
            message: 'items must be a JSON array',
          },
        })
        return
      }

      const options = await deps.quoteShippingUseCase.execute({
        tenantId,
        items: parsedItems,
        destinationZipCode,
      })

      reply.status(200).send(options)
    },
  )
}
