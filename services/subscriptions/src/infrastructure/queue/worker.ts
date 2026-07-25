import { Worker } from 'bullmq'
import { env } from '../../shared/env'
import type { ProcessWebhookUseCase } from '../../application/subscriptions/process-webhook.usecase'
import { SUBSCRIPTIONS_QUEUE_NAME } from './subscriptions.queue'

export function startSubscriptionsWorker(
  processWebhookUseCase: ProcessWebhookUseCase,
): Worker {
  return new Worker(
    SUBSCRIPTIONS_QUEUE_NAME,
    async (job) => {
      if (job.name === 'process-webhook') {
        await processWebhookUseCase.execute(job.data)
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
