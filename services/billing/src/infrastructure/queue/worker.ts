import { Worker } from 'bullmq'
import type { ProcessWebhookUseCase } from '../../application/billing/process-webhook.usecase'
import { env } from '../../shared/env'
import { BILLING_QUEUE_NAME } from './billing.queue'

export function startBillingWorker(
  processWebhookUseCase: ProcessWebhookUseCase,
): Worker {
  return new Worker(
    BILLING_QUEUE_NAME,
    async (job) => {
      if (job.name === 'process-webhook') {
        await processWebhookUseCase.execute(job.data)
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
