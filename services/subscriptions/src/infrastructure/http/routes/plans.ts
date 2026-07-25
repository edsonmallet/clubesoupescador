import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import type { ListPlansUseCase } from '../../../application/subscriptions/list-plans.usecase'
import { ListPlansResponseSchema } from '../schemas/plans'

export type PlansRouteDeps = {
  listPlansUseCase: ListPlansUseCase
}

const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})

export async function registerPlansRoutes(
  app: FastifyInstance,
  deps: PlansRouteDeps,
): Promise<void> {
  app.get(
    '/plans',
    {
      schema: {
        response: { 200: ListPlansResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tenantId = request.headers['x-tenant-id']
      if (typeof tenantId !== 'string') {
        reply.status(400).send({
          error: {
            code: 'MISSING_TENANT',
            message: 'x-tenant-id header is required',
          },
        })
        return
      }

      const plans = await deps.listPlansUseCase.execute({ tenantId })
      reply.status(200).send(
        plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          priceCents: plan.priceCents,
        })),
      )
    },
  )
}
