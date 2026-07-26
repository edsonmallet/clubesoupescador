import { apiClient } from '@/shared/services/api-client'
import type { Order, PaginatedResult } from '@clube/shared-types'

export const ordersService = {
  list: (page = 1) =>
    apiClient.get<PaginatedResult<Order>>(`/v1/admin/orders?page=${page}`),
  dispatch: (id: string, trackingCode: string) =>
    apiClient.patch<Order>(`/v1/admin/orders/${id}`, {
      status: 'shipped',
      trackingCode,
    }),
}
