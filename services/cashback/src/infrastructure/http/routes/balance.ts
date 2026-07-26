import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { GetBalanceUseCase } from '../../../application/balance/get-balance.usecase'
import { BalanceResponseSchema, ErrorResponseSchema } from '../schemas/cashback'

export type BalanceRouteDeps = {
  cashbackAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  getBalanceUseCase: GetBalanceUseCase
}

function requireTenantId(headers: Record<string, unknown>): string | null {
  const tenantId = headers['x-tenant-id']
  return typeof tenantId === 'string' ? tenantId : null
}

export async function registerBalanceRoutes(
  app: FastifyInstance,
  deps: BalanceRouteDeps,
): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [deps.cashbackAuthPreHandler, deps.requireAuth],
      schema: {
        response: { 200: BalanceResponseSchema, 400: ErrorResponseSchema },
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
      const balance = await deps.getBalanceUseCase.execute({
        tenantId,
        uid: user.uid,
      })

      reply.status(200).send({
        availableCents: balance.availableCents,
        expiringSoonCents: balance.expiringSoonCents,
        nextExpiryAt: balance.nextExpiryAt?.toISOString() ?? null,
      })
    },
  )
}
