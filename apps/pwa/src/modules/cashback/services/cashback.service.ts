import { apiClient } from '@/shared/services/api-client'
import type {
  CashbackBalance,
  CashbackEntry,
  PaginatedResult,
} from '@clube/shared-types'

const delay = <T>(value: T) => Promise.resolve(value)

export const cashbackService = {
  // TODO: apiClient.get<CashbackBalance>('/v1/cashback/balance')
  getBalance: () =>
    delay<CashbackBalance>({
      availableCents: 4500,
      expiringSoonCents: 1200,
      nextExpiryAt: '2026-09-30T23:59:59.000Z',
    }),
  getHistory: (page = 1) =>
    apiClient.get<PaginatedResult<CashbackEntry>>(
      `/v1/cashback/history?page=${page}`,
    ),
}
