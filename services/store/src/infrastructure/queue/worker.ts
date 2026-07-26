import { Worker } from 'bullmq'
import type { ProcessPaymentWebhookUseCase } from '../../application/orders/process-payment-webhook.usecase'
import { env } from '../../shared/env'
import { STORE_QUEUE_NAME } from './store.queue'

export function startStoreWorker(
  processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase,
): Worker {
  return new Worker(
    STORE_QUEUE_NAME,
    async (job) => {
      if (job.name === 'process-payment-webhook') {
        await processPaymentWebhookUseCase.execute(job.data)
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
