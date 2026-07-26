import { Worker } from 'bullmq'
import type { ProcessWebhookUseCase } from '../../application/subscriptions/process-webhook.usecase'
import type { GrantXpByUidUseCase } from '../../application/xp/grant-xp-by-uid.usecase'
import { env } from '../../shared/env'
import { SUBSCRIPTIONS_QUEUE_NAME } from './subscriptions.queue'

export function startSubscriptionsWorker(
  processWebhookUseCase: ProcessWebhookUseCase,
  grantXpByUidUseCase: GrantXpByUidUseCase,
): Worker {
  return new Worker(
    SUBSCRIPTIONS_QUEUE_NAME,
    async (job) => {
      if (job.name === 'process-webhook') {
        await processWebhookUseCase.execute(job.data)
        return
      }
      if (job.name === 'grant-xp') {
        await grantXpByUidUseCase.execute(job.data)
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
