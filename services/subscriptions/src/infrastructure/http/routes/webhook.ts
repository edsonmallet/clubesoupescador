import type { FastifyInstance } from 'fastify'
import type { AsaasWebhookEvent } from '../../../application/subscriptions/process-webhook.usecase'
import { env } from '../../../shared/env'
import {
  WebhookErrorResponseSchema,
  WebhookReceivedResponseSchema,
} from '../schemas/webhook'

export type WebhookRouteDeps = {
  enqueueProcessWebhook: (event: AsaasWebhookEvent) => Promise<void>
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

      // Asaas was already told "received", so it will not retry. A failure to
      // enqueue must be logged loudly rather than surfacing as an unhandled
      // rejection after the response was flushed.
      try {
        await deps.enqueueProcessWebhook(request.body as AsaasWebhookEvent)
      } catch (error) {
        request.log.error(error, 'Failed to enqueue webhook event')
      }
    },
  )
}
