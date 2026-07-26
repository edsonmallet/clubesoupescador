import { Queue } from 'bullmq'
import type { EnqueueCashbackDebit } from '../../application/orders/create-order.usecase'
import type {
  EnqueueGrantCashback,
  EnqueueGrantXp,
} from '../../application/orders/process-payment-webhook.usecase'
import { env } from '../../shared/env'

/**
 * store publishes onto the OTHER services' queues (per CLAUDE.md's queue
 * table: subscriptions-queue handles grant-xp, cashback-queue handles
 * grant-cashback). BullMQ only needs the shared Redis connection and queue
 * name to add a job — the consuming worker lives in that other service.
 *
 * Neither services/subscriptions nor services/cashback currently has a
 * worker consuming these job names (subscriptions-queue's worker only
 * handles `process-webhook`, and cashback has no business logic yet), so
 * these jobs sit queued until that consumer is implemented there.
 */
const subscriptionsQueue = new Queue('subscriptions-queue', {
  connection: { url: env.REDIS_URL },
})
const cashbackQueue = new Queue('cashback-queue', {
  connection: { url: env.REDIS_URL },
})

export const enqueueGrantXp: EnqueueGrantXp = async (data) => {
  await subscriptionsQueue.add('grant-xp', data)
}

export const enqueueGrantCashback: EnqueueGrantCashback = async (data) => {
  await cashbackQueue.add('grant-cashback', data)
}

export const enqueueCashbackDebit: EnqueueCashbackDebit = async (data) => {
  await cashbackQueue.add('debit-cashback', data)
}
