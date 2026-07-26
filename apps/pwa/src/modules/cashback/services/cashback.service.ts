import { apiClient } from '@/shared/services/api-client'
import type {
  CashbackBalance,
  CashbackEntry,
  PaginatedResult,
} from '@clube/shared-types'

export const cashbackService = {
  getBalance: () => apiClient.get<CashbackBalance>('/v1/cashback/balance'),
  getHistory: (page = 1) =>
    apiClient.get<PaginatedResult<CashbackEntry>>(
      `/v1/cashback/history?page=${page}`,
    ),
}
