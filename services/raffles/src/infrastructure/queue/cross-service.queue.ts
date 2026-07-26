import { Queue } from 'bullmq'
import type { EnqueueGrantXp } from '../../application/tickets/join-raffle.usecase'
import { env } from '../../shared/env'

// raffles publishes onto subscriptions-queue (grant-xp job) — same pattern
// as services/store and services/cashback. The consuming worker lives in
// services/subscriptions.
const subscriptionsQueue = new Queue('subscriptions-queue', {
  connection: { url: env.REDIS_URL },
})

export const enqueueGrantXp: EnqueueGrantXp = async (data) => {
  await subscriptionsQueue.add('grant-xp', data)
}
