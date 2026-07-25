import { Queue } from 'bullmq'
import type { AsaasWebhookEvent } from '../../application/subscriptions/process-webhook.usecase'
import { env } from '../../shared/env'

export const SUBSCRIPTIONS_QUEUE_NAME = 'subscriptions-queue'

export const subscriptionsQueue = new Queue<AsaasWebhookEvent>(
  SUBSCRIPTIONS_QUEUE_NAME,
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

export async function enqueueProcessWebhook(
  event: AsaasWebhookEvent,
): Promise<void> {
  // Asaas redelivers webhooks until it gets a 200, and recommends using the
  // event `id` for idempotency. BullMQ ignores an add() whose jobId already
  // exists, which deduplicates redeliveries.
  //
  // Limitation: this is best-effort only. Dedup holds only while the job is
  // still retained in Redis (see removeOnComplete/removeOnFail counts above);
  // a redelivery arriving after eviction would be processed again.
  await subscriptionsQueue.add('process-webhook', event, {
    jobId: event.id,
  })
}
