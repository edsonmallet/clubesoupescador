import type { FastifyInstance } from 'fastify'
import { env } from '../../../shared/env'
import type { AsaasPaymentWebhookEvent } from '../../queue/raffles.queue'
import {
  WebhookErrorResponseSchema,
  WebhookReceivedResponseSchema,
} from '../schemas/webhook'

export type WebhookRouteDeps = {
  enqueueConfirmTickets: (event: AsaasPaymentWebhookEvent) => Promise<void>
}

export async function registerWebhookRoutes(
  app: FastifyInstance,
  deps: WebhookRouteDeps,
): Promise<void> {
  app.post(
    '/webhook',
    {
      schema: {
        response: {
          200: WebhookReceivedResponseSchema,
          401: WebhookErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = request.headers['asaas-access-token']
      if (token !== env.ASAAS_WEBHOOK_TOKEN) {
        reply.status(401).send({
          error: {
            code: 'INVALID_WEBHOOK_TOKEN',
            message: 'Invalid webhook token',
          },
        })
        return
      }

      reply.status(200).send({ received: true })

      try {
        await deps.enqueueConfirmTickets(
          request.body as AsaasPaymentWebhookEvent,
        )
      } catch (error) {
        request.log.error(error, 'Failed to enqueue ticket confirmation')
      }
    },
  )
}
