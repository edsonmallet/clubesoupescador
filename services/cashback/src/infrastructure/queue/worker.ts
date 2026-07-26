import { Worker } from 'bullmq'
import type { ExpireCashbackUseCase } from '../../application/expiry/expire-cashback.usecase'
import type { DebitCashbackUseCase } from '../../application/ledger/debit-cashback.usecase'
import type { GrantCashbackUseCase } from '../../application/ledger/grant-cashback.usecase'
import { env } from '../../shared/env'
import { CASHBACK_QUEUE_NAME } from './cashback.queue'

export function startCashbackWorker(
  grantCashbackUseCase: GrantCashbackUseCase,
  debitCashbackUseCase: DebitCashbackUseCase,
  expireCashbackUseCase: ExpireCashbackUseCase,
): Worker {
  return new Worker(
    CASHBACK_QUEUE_NAME,
    async (job) => {
      if (job.name === 'grant-cashback') {
        const data = job.data as {
          tenantId: string
          uid: string
          paidAmountCents: number
          orderId: string
          source: string
        }
        await grantCashbackUseCase.execute({
          tenantId: data.tenantId,
          uid: data.uid,
          source: data.source,
          sourceId: data.orderId,
          paidAmountCents: data.paidAmountCents,
        })
        return
      }

      if (job.name === 'debit-cashback') {
        const data = job.data as {
          tenantId: string
          uid: string
          amountCents: number
          orderId: string
        }
        await debitCashbackUseCase.execute({
          tenantId: data.tenantId,
          uid: data.uid,
          source: 'redeemed',
          sourceId: data.orderId,
          amountCents: data.amountCents,
        })
        return
      }

      if (job.name === 'expire-cashback') {
        await expireCashbackUseCase.execute()
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
