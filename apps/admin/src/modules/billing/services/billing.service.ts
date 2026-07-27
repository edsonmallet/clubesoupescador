import { ApiError, apiClient } from '@/shared/services/api-client'
import type {
  CheckoutInput,
  CheckoutResult,
  SaasPlan,
  TenantBilling,
} from '../types/billing'

export const billingService = {
  getMyBilling: async (): Promise<TenantBilling | null> => {
    try {
      return await apiClient.get<TenantBilling>('/v1/billing/me')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  listPlans: () => apiClient.get<SaasPlan[]>('/v1/billing/plans'),

  checkout: (data: CheckoutInput) =>
    apiClient.post<CheckoutResult>('/v1/billing/checkout', data),
}
