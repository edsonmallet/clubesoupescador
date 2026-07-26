import { apiClient } from '@/shared/services/api-client'
import type {
  CreateCheckoutInput,
  CreateCheckoutResponse,
  MySubscription,
  Plan,
} from '@clube/shared-types'

export const subscriptionsService = {
  listPlans: () => apiClient.get<Plan[]>('/v1/subscriptions/plans'),
  getMySubscription: () =>
    apiClient.get<MySubscription>('/v1/subscriptions/me'),
  createCheckout: (data: CreateCheckoutInput) =>
    apiClient.post<CreateCheckoutResponse>('/v1/subscriptions/checkout', data),
  getMyXp: () => apiClient.get<MySubscription>('/v1/subscriptions/me/xp'),
}
