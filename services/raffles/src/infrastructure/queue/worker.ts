import { Worker } from 'bullmq'
import type { DrawRaffleUseCase } from '../../application/draws/draw-raffle.usecase'
import type { ITicketRepository } from '../../domain/interfaces/ITicketRepository'
import { env } from '../../shared/env'
import type {
  AsaasPaymentWebhookEvent,
  DrawRaffleJobData,
} from './raffles.queue'
import { RAFFLES_QUEUE_NAME } from './raffles.queue'

export function startRafflesWorker(
  drawRaffleUseCase: DrawRaffleUseCase,
  ticketRepository: ITicketRepository,
): Worker {
  return new Worker(
    RAFFLES_QUEUE_NAME,
    async (job) => {
      if (job.name === 'draw-raffle') {
        await drawRaffleUseCase.execute(job.data as DrawRaffleJobData)
        return
      }

      if (job.name === 'confirm-tickets') {
        const event = job.data as AsaasPaymentWebhookEvent
        if (
          event.event !== 'PAYMENT_CONFIRMED' &&
          event.event !== 'PAYMENT_RECEIVED'
        ) {
          return
        }
        const paymentId = event.payment?.id
        if (!paymentId) return
        await ticketRepository.confirmByAsaasPaymentId(paymentId)
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
