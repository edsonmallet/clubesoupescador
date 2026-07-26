import type { FastifyInstance } from 'fastify'
import type { GrantCashbackUseCase } from '../../../application/ledger/grant-cashback.usecase'
import { env } from '../../../shared/env'
import {
  ErrorResponseSchema,
  GrantBodySchema,
  GrantResponseSchema,
} from '../schemas/cashback'

export type InternalRouteDeps = {
  grantCashbackUseCase: GrantCashbackUseCase
}

export async function registerInternalRoutes(
  app: FastifyInstance,
  deps: InternalRouteDeps,
): Promise<void> {
  app.post(
    '/internal/grant',
    {
      schema: {
        body: GrantBodySchema,
        response: { 200: GrantResponseSchema, 401: ErrorResponseSchema },
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
        uid: string
        source: string
        sourceId: string | null
        paidAmountCents: number
      }

      await deps.grantCashbackUseCase.execute(body)

      reply.status(200).send({ granted: true })
    },
  )
}
