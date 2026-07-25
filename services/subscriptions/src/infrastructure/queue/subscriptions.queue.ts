import { Queue } from 'bullmq'
import { env } from '../../shared/env'
import type { AsaasWebhookEvent } from '../../application/subscriptions/process-webhook.usecase'

export const SUBSCRIPTIONS_QUEUE_NAME = 'subscriptions-queue'

export const subscriptionsQueue = new Queue<AsaasWebhookEvent>(
  SUBSCRIPTIONS_QUEUE_NAME,
  { connection: { url: env.REDIS_URL } },
)

export async function enqueueProcessWebhook(
  event: AsaasWebhookEvent,
): Promise<void> {
  await subscriptionsQueue.add('process-webhook', event)
}
