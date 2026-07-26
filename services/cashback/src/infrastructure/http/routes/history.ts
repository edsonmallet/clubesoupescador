import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { GetHistoryUseCase } from '../../../application/history/get-history.usecase'
import { ErrorResponseSchema, HistoryResponseSchema } from '../schemas/cashback'

export type HistoryRouteDeps = {
  cashbackAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  getHistoryUseCase: GetHistoryUseCase
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerHistoryRoutes(
  app: FastifyInstance,
  deps: HistoryRouteDeps,
): Promise<void> {
  app.get(
    '/history',
    {
      preHandler: [deps.cashbackAuthPreHandler, deps.requireAuth],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            perPage: { type: 'number', default: 20 },
          },
        },
        response: { 200: HistoryResponseSchema, 400: ErrorResponseSchema },
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
      const { page = 1, perPage = 20 } = request.query as {
        page?: number
        perPage?: number
      }

      const result = await deps.getHistoryUseCase.execute({
        tenantId,
        uid: user.uid,
        page,
        perPage,
      })

      reply.status(200).send({
        items: result.items.map((entry) => ({
          id: entry.id,
          type: entry.type,
          amountCents: entry.amountCents,
          source: entry.source,
          sourceId: entry.sourceId,
          expiresAt: entry.expiresAt?.toISOString() ?? null,
          createdAt: entry.createdAt.toISOString(),
        })),
        total: result.total,
      })
    },
  )
}
