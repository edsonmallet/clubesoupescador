import { GetBalanceUseCase } from '../../application/balance/get-balance.usecase'
import { ExpireCashbackUseCase } from '../../application/expiry/expire-cashback.usecase'
import { GetHistoryUseCase } from '../../application/history/get-history.usecase'
import { DebitCashbackUseCase } from '../../application/ledger/debit-cashback.usecase'
import { GrantCashbackUseCase } from '../../application/ledger/grant-cashback.usecase'
import { db } from '../db'
import { CashbackConfigRepository } from '../db/repositories/cashback-config.repository'
import { CashbackRepository } from '../db/repositories/cashback.repository'
import { enqueueGrantXp } from '../queue/subscriptions.queue'
import { cashbackAuthPreHandler, requireAuth, requireOwner } from './proxy'

export const cashbackRepository = new CashbackRepository(db)
export const configRepository = new CashbackConfigRepository(db)

export const grantCashbackUseCase = new GrantCashbackUseCase(
  cashbackRepository,
  configRepository,
)
export const debitCashbackUseCase = new DebitCashbackUseCase(cashbackRepository)
export const getBalanceUseCase = new GetBalanceUseCase(cashbackRepository)
export const getHistoryUseCase = new GetHistoryUseCase(cashbackRepository)
export const expireCashbackUseCase = new ExpireCashbackUseCase(
  cashbackRepository,
  enqueueGrantXp,
)

export { cashbackAuthPreHandler, requireAuth, requireOwner }
