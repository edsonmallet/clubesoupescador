import { Queue } from 'bullmq'
import { env } from '../../shared/env'

export const RAFFLES_QUEUE_NAME = 'raffles-queue'

export type DrawRaffleJobData = {
  tenantId: string
  raffleId: string
  contestNumber: number
}

export type AsaasPaymentWebhookEvent = {
  id?: string
  event: 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | string
  payment?: { id?: string }
}

export const rafflesQueue = new Queue(RAFFLES_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
  },
})

export async function enqueueDrawRaffle(
  data: DrawRaffleJobData,
): Promise<void> {
  await rafflesQueue.add('draw-raffle', data)
}

export async function enqueueConfirmTickets(
  event: AsaasPaymentWebhookEvent,
): Promise<void> {
  // Asaas redelivers webhooks until it gets a 200, and recommends using the
  // event `id` for idempotency — same approach as services/subscriptions
  // and services/store's webhook queues.
  await rafflesQueue.add('confirm-tickets', event, { jobId: event.id })
}
