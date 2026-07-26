import type {
  CashbackEntry,
  CashbackEntryType,
} from '../entities/CashbackEntry'

export type CreditCashbackDto = {
  tenantId: string
  uid: string
  type: CashbackEntryType
  amountCents: number
  source: string
  sourceId: string | null
  expiresAt: Date | null
}

export type DebitCashbackDto = {
  tenantId: string
  uid: string
  type: CashbackEntryType
  amountCents: number
  source: string
  sourceId: string | null
}

export type CashbackBalance = {
  availableCents: number
  expiringSoonCents: number
  nextExpiryAt: Date | null
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface ICashbackRepository {
  credit(data: CreditCashbackDto): Promise<void>
  debit(data: DebitCashbackDto): Promise<void>
  getBalance(tenantId: string, uid: string): Promise<CashbackBalance>
  getHistory(
    tenantId: string,
    uid: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<CashbackEntry>>
  getExpiring(before: Date): Promise<CashbackEntry[]>
}
