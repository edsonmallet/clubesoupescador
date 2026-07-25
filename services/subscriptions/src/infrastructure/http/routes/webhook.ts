import type { FastifyInstance } from 'fastify'
import type { AsaasWebhookEvent } from '../../../application/subscriptions/process-webhook.usecase'
import { env } from '../../../shared/env'

export type WebhookRouteDeps = {
  enqueueProcessWebhook: (event: AsaasWebhookEvent) => Promise<void>
}

export async function registerWebhookRoutes(
  app: FastifyInstance,
  deps: WebhookRouteDeps,
): Promise<void> {
  app.post('/webhook', async (request, reply) => {
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

    await deps.enqueueProcessWebhook(request.body as AsaasWebhookEvent)
  })
}
