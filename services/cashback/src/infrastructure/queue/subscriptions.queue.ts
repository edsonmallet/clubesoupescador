import { Queue } from 'bullmq'
import type { EnqueueGrantXp } from '../../application/expiry/expire-cashback.usecase'
import { env } from '../../shared/env'

// cashback publishes onto subscriptions-queue (grant-xp job) — the consuming
// worker lives in services/subscriptions, this only needs the shared Redis
// connection and queue name to add a job.
const subscriptionsQueue = new Queue('subscriptions-queue', {
  connection: { url: env.REDIS_URL },
})

export const enqueueGrantXp: EnqueueGrantXp = async (data) => {
  await subscriptionsQueue.add('grant-xp', data)
}
