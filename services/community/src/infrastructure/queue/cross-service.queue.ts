import { Queue } from 'bullmq'
import type { EnqueueGrantXp } from '../../application/topics/create-topic.usecase'
import { env } from '../../shared/env'

// community publishes onto subscriptions-queue (grant-xp job) — same
// pattern as services/store, services/cashback, services/raffles. The
// consuming worker lives in services/subscriptions.
const subscriptionsQueue = new Queue('subscriptions-queue', {
  connection: { url: env.REDIS_URL },
})

export const enqueueGrantXp: EnqueueGrantXp = async (data) => {
  await subscriptionsQueue.add('grant-xp', data)
}
