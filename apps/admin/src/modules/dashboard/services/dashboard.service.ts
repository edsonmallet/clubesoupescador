import type { CashbackSummary, StoreSummary, SubscriptionsSummary } from '@clube/shared-types'
import { apiClient } from '@/shared/services/api-client'

export const dashboardService = {
  getSubscriptionsSummary: () =>
    apiClient.get<SubscriptionsSummary>('/v1/admin/subscriptions-summary'),
  getStoreSummary: () => apiClient.get<StoreSummary>('/v1/admin/store-summary'),
  getCashbackSummary: () => apiClient.get<CashbackSummary>('/v1/admin/cashback-summary'),
}
