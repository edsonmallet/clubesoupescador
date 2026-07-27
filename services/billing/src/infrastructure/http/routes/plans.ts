import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreatePlanUseCase } from '../../../application/plans/create-plan.usecase'
import type { ListPlansUseCase } from '../../../application/plans/list-plans.usecase'
import type { UpdatePlanUseCase } from '../../../application/plans/update-plan.usecase'
import type { SaasPlan } from '../../../domain/entities/saas-plan'
import {
  CreatePlanBodySchema,
  ErrorResponseSchema,
  ListPlansResponseSchema,
  SaasPlanSchema,
  UpdatePlanBodySchema,
} from '../schemas/plans'

export type PlansRouteDeps = {
  billingAuthPreHandler: preHandlerHookHandler
  requireSuperAdmin: preHandlerHookHandler
  listPlansUseCase: ListPlansUseCase
  createPlanUseCase: CreatePlanUseCase
  updatePlanUseCase: UpdatePlanUseCase
}

function serializePlan(plan: SaasPlan) {
  return {
    id: plan.id,
    name: plan.name,
    priceCents: plan.priceCents,
    active: plan.active,
    createdAt: plan.createdAt.toISOString(),
  }
}

export async function registerPlansRoutes(
  app: FastifyInstance,
  deps: PlansRouteDeps,
): Promise<void> {
  // No guard: the checkout screen used by store owners lists plans before
  // they have any tenant-scoped role beyond simple authentication.
  app.get(
    '/plans',
    {
      schema: { response: { 200: ListPlansResponseSchema } },
    },
    async (_request, reply) => {
      const plans = await deps.listPlansUseCase.execute()
      reply.status(200).send(plans.map(serializePlan))
    },
  )

  app.post(
    '/plans',
    {
      preHandler: [deps.billingAuthPreHandler, deps.requireSuperAdmin],
      schema: {
        body: CreatePlanBodySchema,
        response: { 201: SaasPlanSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { name, priceCents, active } = request.body as {
        name: string
        priceCents: number
        active?: boolean
      }

      const plan = await deps.createPlanUseCase.execute({
        name,
        priceCents,
        active: active ?? true,
      })

      reply.status(201).send(serializePlan(plan))
    },
  )

  app.patch(
    '/plans/:id',
    {
      preHandler: [deps.billingAuthPreHandler, deps.requireSuperAdmin],
      schema: {
        body: UpdatePlanBodySchema,
        response: { 200: SaasPlanSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as {
        name?: string
        priceCents?: number
        active?: boolean
      }

      const plan = await deps.updatePlanUseCase.execute({ id, ...body })

      reply.status(200).send(serializePlan(plan))
    },
  )
}
