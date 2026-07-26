import { apiClient } from '@/shared/services/api-client'
import type { Order, PaginatedResult } from '@clube/shared-types'

export const ordersService = {
  list: (page = 1) =>
    apiClient.get<PaginatedResult<Order>>(`/v1/orders?page=${page}`),
  getById: (id: string) => apiClient.get<Order>(`/v1/orders/${id}`),
}
