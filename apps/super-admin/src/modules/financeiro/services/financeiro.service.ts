import { apiClient } from '@/shared/services/api-client'
import type { BillingOverview } from '../types/billing-overview'

export const financeiroService = {
  getOverview: () => apiClient.get<BillingOverview>('/v1/billing/tenants'),
}
