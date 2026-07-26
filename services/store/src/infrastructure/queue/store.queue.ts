import { Queue } from 'bullmq'
import type { AsaasPaymentWebhookEvent } from '../../application/orders/process-payment-webhook.usecase'
import { env } from '../../shared/env'

export const STORE_QUEUE_NAME = 'store-queue'

export const storeQueue = new Queue<AsaasPaymentWebhookEvent>(
  STORE_QUEUE_NAME,
  {
    connection: { url: env.REDIS_URL },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 1000 },
    },
  },
)

export async function enqueueProcessPaymentWebhook(
  event: AsaasPaymentWebhookEvent,
): Promise<void> {
  // Same idempotency approach as services/subscriptions: Asaas redelivers
  // until it gets a 200 and recommends the event `id` as dedup key. BullMQ
  // ignores an add() whose jobId already exists.
  await storeQueue.add('process-payment-webhook', event, { jobId: event.id })
}
