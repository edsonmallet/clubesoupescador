import type { Member, Order, PaginatedResult } from '@clube/shared-types'
import { apiClient } from '@/shared/services/api-client'

export const membersService = {
  list: (page = 1) => apiClient.get<PaginatedResult<Member>>(`/v1/admin/members?page=${page}`),
  promote: (uid: string) =>
    apiClient.patch<{ promoted: boolean }>(`/v1/admin/members/${uid}/role`, {
      role: 'community_mod',
    }),
  getOrders: (uid: string) =>
    apiClient.get<PaginatedResult<Order>>(`/v1/admin/orders?uid=${uid}`),
}
