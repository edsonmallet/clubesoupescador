import { Queue } from 'bullmq'
import { env } from '../../shared/env'

export const CASHBACK_QUEUE_NAME = 'cashback-queue'

export const cashbackQueue = new Queue(CASHBACK_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
  },
})

/**
 * Registers the nightly expiry job as a BullMQ repeatable job. add() with a
 * fixed jobId + repeat pattern is idempotent — calling this on every service
 * boot does not create duplicate schedules.
 */
export async function scheduleExpiryJob(): Promise<void> {
  await cashbackQueue.add(
    'expire-cashback',
    {},
    {
      jobId: 'expire-cashback-cron',
      repeat: { pattern: '0 2 * * *' }, // 02:00 daily
    },
  )
}
