'use client'

import { useQuery } from '@tanstack/react-query'
import { ordersService } from '../services/orders.service'

export function useAdminOrders(page = 1) {
  return useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => ordersService.list(page),
  })
}
