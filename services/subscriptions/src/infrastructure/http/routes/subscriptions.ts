import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateCheckoutUseCase } from '../../../application/subscriptions/create-checkout.usecase'
import type { ISubscriptionRepository } from '../../../domain/interfaces/ISubscriptionRepository'
import {
  CreateCheckoutBodySchema,
  CreateCheckoutResponseSchema,
  MySubscriptionResponseSchema,
} from '../schemas/subscriptions'

export type SubscriptionsRouteDeps = {
  subscriptionsAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  createCheckoutUseCase: CreateCheckoutUseCase
  subscriptionRepository: ISubscriptionRepository
}

export async function registerSubscriptionsRoutes(
  app: FastifyInstance,
  deps: SubscriptionsRouteDeps,
): Promise<void> {
  app.post(
    '/subscriptions/checkout',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireAuth],
      schema: {
        body: CreateCheckoutBodySchema,
        response: { 200: CreateCheckoutResponseSchema },
      },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser
      const { planId, name, cpfCnpj } = request.body as {
        planId: string
        name: string
        cpfCnpj: string
      }

      const result = await deps.createCheckoutUseCase.execute({
        uid: user.uid,
        tenantId: user.tenant_id as string,
        planId,
        name,
        cpfCnpj,
      })

      reply.status(200).send(result)
    },
  )

  app.get(
    '/subscriptions/me',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: MySubscriptionResponseSchema } },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser

      const subscription = await deps.subscriptionRepository.findByUid(
        user.uid,
        user.tenant_id as string,
      )

      if (!subscription) {
        reply.status(200).send(null)
        return
      }

      reply.status(200).send({
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        totalXp: subscription.totalXp,
        levelId: subscription.levelId,
      })
    },
  )
}
